import asyncio
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from mcp_use import MCPAgent, MCPClient
from loguru import logger
from app_context import get_bid
from database import SessionLocal
import models
from sqlalchemy import desc

# Load .env explicitly from the project root
#root_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv()

class AgentService:
    def __init__(self):
        # Resolve absolute path to server.py
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.server_path = os.path.join(current_dir, "server.py")
        
        if not os.path.exists(self.server_path):
            logger.error(f"Server file not found at: {self.server_path}")
            raise FileNotFoundError(f"server.py not found at {self.server_path}")

        self.config = {
            "mcpServers": {
                "social-sphere": {
                    "command": "python", 
                    "args": [self.server_path],
                }
            }
        }
        self.client = None
        self.active_agents = {} # Key: session_id (e.g., email), Value: MCPAgent instance
        
    async def start(self):
        """Initializes the MCP Client and Agent."""
        try:
            logger.info("🚀 Starting AgentService...")
            self.client = MCPClient.from_dict(self.config)
            logger.info("✅ AgentService started (Client Connected).")
            
        except Exception as e:
            logger.error(f"Failed to start AgentService: {e}")
            raise e

    async def stop(self):
        """Closes the MCP Client connection."""
        if self.client:
            logger.info("🛑 Stopping AgentService...")
            try:
                await self.client.close_all_sessions()
            except asyncio.CancelledError:
                logger.info("⚠️ AgentService shutdown cancelled (normal during reload).")
            except Exception as e:
                logger.error(f"Error checking/stopping agent service: {e}")
            logger.info("✅ AgentService stopped.")

    async def _get_chat_history_summary(self, email: str) -> str:
        """
        Fetches recent chat history for the user and summarizes it.
        """
        if not email:
            return ""

        try:
            # 1. Fetch recent history from DB
            # Use sync DB call in thread or just quick sync? 
            # Ideally async, but SessionLocal is sync. We'll do it quickly.
            # Limiting to last 10 interactions to avoid massive context
            history_text = ""
            with SessionLocal() as db:
                chats = db.query(models.ChatHistory)\
                    .filter(models.ChatHistory.username == email)\
                    .order_by(desc(models.ChatHistory.id))\
                    .limit(10)\
                    .all()
                
                if not chats:
                    return ""
                
                # Reverse to chronological order
                chats = chats[::-1]
                
                history_text = "\n".join([f"User: {c.input_message}\nAI: {c.agent_response}" for c in chats])

            if not history_text:
                return ""

            # 2. Summarize using a separate LLM call (lightweight model)
            # We use a direct Groq call here to avoid recursion with the main agent
            groq_api_key = os.getenv("GROQ_API_KEY")
            if not groq_api_key:
                return ""
            
            client = ChatGroq(model="openai/gpt-oss-20b", groq_api_key=groq_api_key) # Use smaller model for summary
            
            summary_prompt = f"""
            Summarize the following conversation history into a concise context for the AI agent.
            Highlight key user preferences, tasks in progress, and recent topics.
            
            History:
            {history_text}
            
            Summary:
            """
            
            # Invoking invoke() which is sync or async? ChatGroq invoke is sync usually?
            # Langchain invoke is sync. ainvoke is async.
            response = await client.ainvoke(summary_prompt)
            summary = response.content
            
            logger.info(f"Generated chat history summary for {email}")
            return summary

        except Exception as e:
            logger.error(f"Failed to summarize chat history: {e}")
            return ""


    async def run_query(self, query: str, context: dict = None):
        """
        Runs a query against the MCP Agent.
        
        Args:
            query: The user's prompt.
            context: Optional dictionary containing session details (e.g., 'bid', 'user_id', 'tokens').
        """
        if not self.client:
            # Lazy init if not started (fallback)
            logger.warning("AgentService not started. Attempting lazy start...")
            await self.start()
            
        if not self.client:
             return "❌ Error: Agent failed to initialize."
        
        # Ensure context is a dict
        if context is None:
            context = {}

        # Resolve Business ID: Explicit context > Global Context > Email Lookup (Fallback)
        bid = context.get('bid')
        logger.info(f"DEBUG: agent_service.run_query START - Explicit BID: {bid}, Global get_bid(): {get_bid()}")
        email = context.get('email')
        
        if not bid:
            bid = get_bid()
            # If still no BID, try DB lookup by email
            if not bid and email:
                try:
                    from database import SessionLocal
                    import models
                    with SessionLocal() as db:
                        user = db.query(models.UserCredentials).filter(models.UserCredentials.email == email.lower()).first()
                        if user:
                            bid = user.bid
                            logger.info(f"✅ Resolved BID {bid} from DB for email {email}")
                except Exception as e:
                    logger.error(f"Failed to resolve BID from DB: {e}")

            if bid:
                 context['bid'] = bid
                 # Also try to fill other missing context if we had a proper user object globally, 
                 # but for now we only have 'bid' globally.

        # Determine Session ID
        session_id = context.get('email') if context.get('email') else "anonymous"

        # Get Chat History Summary
        history_summary = ""
        if session_id != "anonymous":
            history_summary = await self._get_chat_history_summary(session_id)


        # Construct Contextual Prompt (Prepend only if not already in history? 
        # Actually, for robust per-query context update, we prefer prepending context instructions 
        # to the current user message, so the LLM knows the *current* context even if history exists.)
        full_query = query
        if context:
            system_instruction = f"""
            [SYSTEM CONTEXT]
            You are acting on behalf of a specific user/business.
            - Business ID (bid): {context.get('bid')}
            - User Email: {context.get('email')}
            - Facebook Page ID: {os.getenv('FB_PAGE_ID')}
            - Instagram ID: {os.getenv('INSTA_PAGE_ID')}
            - Facebook Access Token: {os.getenv('FB_SYSTEM_TOKEN')}
            - Instagram Access Token: {os.getenv('FB_SYSTEM_TOKEN')}
            
            IMPORTANT:
            1. For 'search_social_sphere_context', YOU MUST USE the 'bid' provided above. IF BID IS 'None', YOU MUST NOT CALL THIS TOOL.
            2. For Facebook and Instagram tools, do NOT ask for or pass 'page_id', 'ig_id', or tokens. The system handles authentication automatically.
            3. Do NOT ask the user for these IDs.
            4. IF 'retrieve_business_context' fails or returns no info, DO NOT RETRY it. Proceed with your best general knowledge.
            
            [PREVIOUS CHAT HISTORY SUMMARY]
            {history_summary}
            
            [USER QUERY]
            {query}
            """
            full_query = system_instruction
            
        try:
            # Check for existing agent
            if session_id in self.active_agents:
                logger.info(f"Adding to existing conversation for session: {session_id}")
                agent = self.active_agents[session_id]
            else:
                logger.info(f"Initializing NEW agent for session: {session_id}")
                # Groq LLM
                groq_api_key = os.getenv("GROQ_API_KEY")
                llm = ChatGroq(model="openai/gpt-oss-20b", groq_api_key=groq_api_key)
                
                # Create persistent agent instance reusing the heavy MCPClient connection
                agent = MCPAgent(llm=llm, client=self.client) # max_steps default
                self.active_agents[session_id] = agent
            
            logger.info(f"Running agent query with context: {context}")
            result = await agent.run(full_query)
            return result
        except Exception as e:
            logger.error(f"Agent execution failed: {e}")
            return f"❌ Agent Error: {str(e)}"

# Singleton instance for easy import
agent_service = AgentService()