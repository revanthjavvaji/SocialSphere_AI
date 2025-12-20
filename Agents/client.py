import asyncio
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from mcp_use import MCPAgent, MCPClient

# Load .env explicitly from the project root
# current file: Agents/client.py -> parent: Agents -> parent: Root
root_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(root_env_path)

# Point to server file
server_path = "server.py"

# Config for MCP client
CONFIG = {
    "mcpServers": {
        "fii-demo": {
            "command": "python",       # use uv to run server
            "args": [server_path],
        }
    }
}

async def main():
    # Init MCP client
    client = MCPClient.from_dict(CONFIG)

    # Groq LLM
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        print("❌ Error: GROQ_API_KEY not found in environment variables.")
        return

    llm = ChatGroq(
        model="openai/gpt-oss-20b",
        groq_api_key=groq_api_key
    )

    # Wire LLM + MCP
    agent = MCPAgent(llm=llm, client=client, max_steps=20)

    #query = "Create me a reel on upcoming F1 title decider race going to be held in Abu Dhabi. Do web search to get facts correct."
    #query = f'''"In recent years, the rapid advancement of artificial intelligence has transformed almost every industry, from healthcare to finance, and from entertainment to transportation. AI-powered tools are no longer just experimental technologies; they are becoming integral components of everyday workflows, helping organizations optimize operations, predict trends, and make data-driven decisions faster than ever before. The rise of generative AI, in particular, has unlocked new possibilities for creativity, enabling designers, writers, and marketers to produce high-quality content at unprecedented speed. Alongside these opportunities, however, come significant challenges, including ethical considerations, data privacy concerns, and the need for transparent, explainable AI systems. Companies that fail to address these challenges risk losing public trust and falling behind competitors who leverage AI responsibly. At the same time, governments and regulatory bodies are racing to implement frameworks that ensure AI technologies are safe, fair, and accountable. Educational institutions are also stepping up, providing programs and resources to equip the next generation of professionals with the skills necessary to thrive in an AI-driven world. Meanwhile, researchers continue to push the boundaries of what AI can do, exploring areas like reinforcement learning, natural language understanding, and autonomous robotics, with the promise of innovations that could redefine the limits of human productivity and creativity. As AI becomes more pervasive, collaboration between humans and intelligent systems will become essential, emphasizing the need for human oversight, ethical guidance, and continuous learning to harness the full potential of these transformative technologies.". Refine this content'''
    # Ask it to use MCP tools
    query = f'''summarise me this blog in 10-12 lines: https://medium.com/@daven_96113/you-say-soft-skills-i-say-nice-career-you-got-there-ac00eb6172d2'''
    result = await agent.run(query
 #  """Email to Revanth Javaji at revanthjavaji@jocata.com
  #about brand collaboration idea. Make it friendly. Also do web search about latest thing about Company and add in email if needed."""
)

    print("\n🔥 Result:", result)

    await client.close_all_sessions()

if __name__ == "__main__":
    asyncio.run(main())
