from typing import Any
import hashlib
from loguru import logger
import aiohttp
from groq import Groq
from mcp.server.fastmcp import FastMCP
import asyncio
from tavily import TavilyClient
import requests
import time
import os
from dotenv import load_dotenv

# RAG Tools Import (Fixing potential naming conflicts)
# Ensure RAG/tools.py is accessible. RAG is a sibling package.
try:
    from RAG.tools import search_social_sphere_context as rag_search_tool
except ImportError:
    # Fallback or specific handling if running from inside Agents/
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from RAG.tools import search_social_sphere_context as rag_search_tool

from database import SessionLocal
from models import PostHistory, UserCredentials
from datetime import datetime

# Load .env explicitly from the project root
# current file: Agents/server.py -> parent: Agents -> parent: Root
#root_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv()

# Initialize FastMCP server
mcp = FastMCP("social-sphere-agent")

# Load Keys from Env
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not TAVILY_API_KEY:
    logger.warning("TAVILY_API_KEY not found in environment")
if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY not found in environment")

if TAVILY_API_KEY:
    try:
        tavily = TavilyClient(api_key=TAVILY_API_KEY)
    except Exception as e:
        logger.warning(f"Failed to initialize TavilyClient: {e}")
        tavily = None
else:
    tavily = None

# ---------------------------------------------------------------------
# Ported Tools from tools.py (Social Posting & RAG)
# ---------------------------------------------------------------------

@mcp.tool()
async def post_to_facebook(message: str, bid: int) -> str:
    """
    PUBLISH A TEXT POST TO FACEBOOK.
    
    Use this tool `post_to_facebook` EXCLUSIVELY when the user wants to post a status update, announcement, or text message to their Facebook Business Page.
    
    **Do NOT use this tool for:**
    - Posting images (unless it's just a text link).
    - Posting to Instagram (use `post_to_instagram` instead).
    - Personal profile posts (this only works for Business Pages).
    
    **Parameters:**
    - `message` (required): The actual text content to publish. E.g., "Hello world! Check out our new sale."
    - `bid` (required): Business ID of the user.

    **Credentials:**
    - Uses `FACEBOOK_PAGE_ID` and `FACEBOOK_ACCESS_TOKEN` from environment variables.
    """
    page_id = os.getenv("FB_PAGE_ID")
    system_token = os.getenv("FB_SYSTEM_TOKEN")

    if not page_id:
        return "❌ Error: 'FACEBOOK_PAGE_ID' not found in environment variables."
    if not system_token:
        return "❌ Error: 'FACEBOOK_ACCESS_TOKEN' not found in environment variables."

    # Step 1: Simple Validation
    val_url = f"https://graph.facebook.com/v20.0/{page_id}"
    val_params = {"fields": "name", "access_token": system_token}
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(val_url, params=val_params) as resp:
                val_res = await resp.json()
    except Exception as e:
        return f"❌ Connection Error during validation: {e}"
    
    if "error" in val_res:
        error_msg = f"❌ Validation Failed: {val_res['error']['message']}"
        logger.error(error_msg)
        return error_msg

    logger.info(f"✅ Token verified for: {val_res.get('name')}")

    # Step 2: Publish to Page Feed
    post_url = f"https://graph.facebook.com/v2.0/{page_id}/feed"
    payload = {
        'message': message,
        'access_token': system_token
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(post_url, data=payload) as resp:
                result = await resp.json()
                if resp.status == 200:
                    success_msg = f"🚀 Successfully Published! Post ID: {result.get('id')}"
                    logger.info(success_msg)
                    
                    # Log to PostHistory
                    try:
                        db = SessionLocal()
                        user = db.query(UserCredentials).filter(UserCredentials.bid == bid).first()
                        email = user.email if user else f"Unknown_bid_{bid}"
                        
                        new_post = PostHistory(
                            username=email,
                            text=message,
                            image_url=None,
                            timestamp=datetime.now().isoformat(),
                            media_used="Facebook"
                        )
                        db.add(new_post)
                        db.commit()
                        db.close()
                    except Exception as db_e:
                        logger.error(f"Failed to log post to database: {db_e}")

                    return success_msg
                else:
                    error_msg = f"❌ Post Failed: {result}"
                    logger.error(error_msg)
                    if result.get('error', {}).get('code') == 200:
                        advice = "💡 REASON: You must go to Business Settings > System Users > Add Assets and grant 'Full Control' for this Page."
                        logger.info(advice)
                        return f"{error_msg}\n{advice}"
                    return error_msg
    except Exception as e:
        return f"❌ Connection Error during posting: {e}"

@mcp.tool()
async def post_to_instagram(image_url: str, caption: str, bid: int) -> str:
    """
    PUBLISH AN IMAGE TO INSTAGRAM.

    Use this tool `post_to_instagram` EXCLUSIVELY when the user wants to upload a photo/image to their Instagram Business Account.
    
    **Critical Requirements:**
    - Instagram DOES NOT support text-only posts. You MUST provide an `image_url`.
    - The `image_url` must be a public, direct link to a JPEG/PNG file.
    
    **Parameters:**
    - `image_url` (required): Public URL of the image to post.
    - `caption` (required): The text description/caption to go with the image.
    - `bid` (required): Business ID of the user.

    **Credentials:**
    - Uses `INSTA_PAGE_ID` and `FB_SYSTEM_TOKEN` from environment variables.
    """
    try:
        ig_id = os.getenv("INSTA_PAGE_ID")
        token = os.getenv("FB_SYSTEM_TOKEN")

        if not ig_id:
            return "❌ Error: 'INSTA_PAGE_ID' not found in environment variables."
        if not token:
            return "❌ Error: 'FB_SYSTEM_TOKEN' not found in environment variables."

        # STEP 1: Create the Media Container
        container_url = f"https://graph.facebook.com/v20.0/{ig_id}/media"
        payload = {
            'image_url': image_url,
            'caption': caption,
            'access_token': token
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(container_url, data=payload) as resp:
                res_data = await resp.json()
        
        if "id" not in res_data:
            error_msg = f"❌ Container Error: {res_data}"
            logger.error(error_msg)
            return error_msg

        creation_id = res_data["id"]
        logger.info(f"✅ Container created. ID: {creation_id}")

        # STEP 2: Wait for processing (Async wait)
        logger.info("Waiting 10 seconds for Instagram to process the image...")
        await asyncio.sleep(10)

        # STEP 3: Publish the Container
        publish_url = f"https://graph.facebook.com/v2.0/{ig_id}/media_publish"
        publish_payload = {
            'creation_id': creation_id,
            'access_token': token
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(publish_url, data=publish_payload) as resp:
                publish_res = await resp.json()
                if resp.status == 200:
                    success_msg = f"🚀 Successfully posted to Instagram! ID: {publish_res.get('id')}"
                    logger.info(success_msg)

                    # Log to PostHistory
                    try:
                        db = SessionLocal()
                        user = db.query(UserCredentials).filter(UserCredentials.bid == bid).first()
                        email = user.email if user else f"Unknown_bid_{bid}"
                        
                        new_post = PostHistory(
                            username=email,
                            text=caption,
                            image_url=image_url,
                            timestamp=datetime.now().isoformat(),
                            media_used="Instagram"
                        )
                        db.add(new_post)
                        db.commit()
                        db.close()
                    except Exception as db_e:
                        logger.error(f"Failed to log post to database: {db_e}")

                    return success_msg
                else:
                    error_msg = f"❌ Publish Failed: {publish_res}"
                    logger.error(error_msg)
                    return error_msg

    except asyncio.CancelledError:
        logger.warning("⚠️ post_to_instagram cancelled.")
        return "⚠️ Action cancelled."
    except Exception as e:
        logger.error(f"❌ Error in post_to_instagram: {e}")
        return f"❌ Error: {e}"

@mcp.tool()
async def retrieve_business_context(query: str, bid: int = None) -> str:
    """
    Use this tool to retrieve BUSINESS-SPECIFIC CONTEXT from the knowledge base
    using Retrieval-Augmented Generation (RAG).

    WHEN TO USE:
    - When the user asks for captions, posts, emails, or marketing plans
      that must be tailored to a specific business.
    - When the response requires brand voice, past posts, products,
      offers, or previously stored business information.
    - ALWAYS call this tool before generating marketing content
      for a business.

    WHAT THIS TOOL DOES:
    - Searches the vector database using the user's query.
    - Retrieves the most relevant document chunks related to the given business_id.
    - Returns clean, text-based context for the LLM to use in generation.

    INPUTS:
    - query (str): The user request or content generation instruction.
    - business_id (str): Unique identifier of the business whose data
      should be retrieved.

    OUTPUT:
    - A plain text string containing relevant business-specific context.

    IMPORTANT:
    - Do NOT hallucinate business details.
    - If the returned context is empty, continue with general best practices.

    """
    # NO FALLBACKS. 'bid' must be provided by the caller (Agent).
    if bid is None:
        return "❌ Error: 'bid' (Business ID) is missing. The Agent MUST provide it from the session context."
    
    # 1. Retrieve Context (Run sync RAG tool in thread)
    context = await asyncio.to_thread(rag_search_tool, bid=bid, query=query)
    #context = rag_search_tool(bid=bid, query=query)
    
    # 2. Use LLM to Summarize/Answer based on Context 
    # (Using the server's same LLM helper for consistency)
    if not context or "No relevant context found" in context:
        return "⚠️ No relevant information found in the business documents or industry insights."

    prompt = f"""
    You are a Business Intelligence Assistant.
    Answer the user query based ONLY on the provided context below.
    
    Query: "{query}"
    
    Context:
    {context}
    
    Summary/Answer:
    """
    
    try:
        res = await call_groq_async(prompt)
        #res = call_groq_async(prompt)
        return res.choices[0].message.content
    except Exception as e:
        return f"❌ Error generating RAG answer: {e}"

# ---------------------------------------------------------------------
# Existing Tools
# ---------------------------------------------------------------------

async def resolve_content(content: str | None, url: str | None) -> str:
    """
    Resolves content either from direct text or URL.
    URL takes priority.
    """
    if url:
        search_data = tavily.search(url)
        return f"Content fetched from URL:\n{search_data}"

    if content:
        return content

    raise ValueError("Either content or url must be provided")


async def call_groq_async(prompt):
    """Run Groq sync client in a non-blocking thread."""
    def _call():
        client = Groq(api_key=GROQ_API_KEY)
        return client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )

    return await asyncio.to_thread(_call)

@mcp.tool()
async def content_summarizer(
    content: str | None = None,
    url: str | None = None,
    length: str = "medium"
) -> dict:
    """
    Summarize content from raw text or a URL.

    If both `content` and `url` are provided, the URL takes priority.
    The summary is factual, concise, and preserves key insights.

    Args:
        content (str, optional): Raw text to summarize.
        url (str, optional): URL to fetch and summarize.
        length (str, optional): Summary length.
            Options: "short", "medium", "detailed".
            Defaults to "medium".

    Returns:
        dict: JSON string containing the summary.

    Raises:
        ValueError: If neither content nor url is provided.
    """

    resolved_content = await resolve_content(content, url)

    prompt = f"""
Summarize the following content.

Length: {length} (short | medium | detailed)

\"\"\"{resolved_content}\"\"\"

Rules:
- Clear and factual
- No hallucinations
- Preserve key insights

Return JSON only.
"""

    res = await call_groq_async(prompt)
    return res.choices[0].message.content


@mcp.tool()
async def seo_keyword_finder(
    topic: str | None = None,
    content: str | None = None,
    url: str | None = None,
    use_web_search: bool = True
) -> dict:
    """
    Generate SEO keywords from a topic, content, or URL.

    Keywords include estimated search volume, difficulty,
    and user intent classification.

    Args:
        topic (str, optional): Primary topic for keyword generation.
        content (str, optional): Text used for keyword extraction.
        url (str, optional): URL to analyze for keywords.
        use_web_search (bool, optional): Whether to use live web data.
            Defaults to True.

    Returns:
        dict: JSON list of SEO keywords with metadata.
    """

    resolved_content = ""
    if url or content:
        resolved_content = await resolve_content(content, url)

    prompt = f"""
Generate SEO keywords.

Topic: {topic}
Content:
\"\"\"{resolved_content}\"\"\"

Use web search insights: {use_web_search}

For each keyword include:
- keyword
- estimated search volume
- difficulty (1–100)
- intent (informational / transactional / navigational)

Return JSON only.
"""

    res = await call_groq_async(prompt)
    return res.choices[0].message.content


@mcp.tool()
async def microcontent_generator(
    content: str | None = None,
    url: str | None = None,
    count: int = 10
) -> dict:
    """
    Generate short, viral micro-content lines from text or an article.

    Each line is designed to be highly shareable on social media.

    Args:
        content (str, optional): Source text.
        url (str, optional): Article URL.
        count (int, optional): Number of micro-content lines.
            Defaults to 10.

    Returns:
        dict: JSON array of viral micro-content lines.
    """

    resolved_content = await resolve_content(content, url)

    prompt = f"""
Extract {count} viral micro-content lines from:

\"\"\"{resolved_content}\"\"\"

Rules:
- 6–12 words each
- Emotional or insight-driven
- No emojis, no hashtags
- Highly shareable

Return JSON only.
"""

    res = await call_groq_async(prompt)
    return res.choices[0].message.content


@mcp.tool()
async def thread_or_carousel(
    topic: str,
    content: str | None = None,
    url: str | None = None,
    format: str = "carousel"
) -> dict:
    """
    Generate Twitter thread or Instagram carousel from content or URL.
    """

    resolved_content = await resolve_content(content, url)

    prompt = f"""
Convert the following into a social {format}.

Topic: {topic}

Source:
\"\"\"{resolved_content}\"\"\"

Rules:
- Carousel → 10 slides (Hook → Value → CTA)
- Thread → 8–12 tweets
- Short, punchy, scroll-stopping
- Clear flow and narrative

Return JSON only.
"""

    res = await call_groq_async(prompt)
    return res.choices[0].message.content


@mcp.tool()
async def topic_researcher(topic: str, use_web_search: bool = True) -> dict:

    search_data = ""
    if use_web_search:
        search_data = tavily.search(topic)

    prompt = f"""
Using the research data below, summarize the topic:

Topic: {topic}

Raw data:
{search_data}

Return JSON:
{{
 "summary": "3–5 paragraph summary",
 "key_points": [...],
 "latest_news": [...]
}}
"""

    res = await call_groq_async(prompt)
    return res.choices[0].message.content


@mcp.tool()
async def hashtag_optimizer(
    topic: str,
    platform: str = "instagram",
    use_web_search: bool = True
) -> dict:
    """
    Generate viral + trending hashtags for a given topic & platform.
    """

    search_data = ""
    if use_web_search:
        search_data = tavily.search(f"Trending hashtags for {topic} on {platform}")

    prompt = f"""
Generate 40–50 viral hashtags for the following:

Topic: {topic}
Platform: {platform}

Trending data from web (if available):
{search_data}

Rules:
- Mix broad & niche tags
- DO NOT number them
- All lowercase
- No more than 50 hashtags
Return JSON:
{{"hashtags": [...]}}
"""

    response = await call_groq_async(prompt)
    return response.choices[0].message.content

@mcp.tool()
async def caption_analyzer(caption: str) -> dict:
    """
    Analyze the quality of a social media caption.
    """

    prompt = f"""
Analyze the following caption:

\"\"\"{caption}\"\"\"

Score it 1–10 on:
- Readability
- Engagement potential
- Emotional tone strength
- Sentiment (positive/neutral/negative)
- Creativity
- Virality

Return JSON with:
{{
 "scores": {{...}},
 "summary": "one paragraph feedback",
 "recommendations": ["...", "..."]
}}
"""

    resp = await call_groq_async(prompt)
    return resp.choices[0].message.content


@mcp.tool()
async def tone_converter(content: str, tone: str) -> dict:

    prompt = f"""
Convert the following text to a **{tone}** tone:

\"\"\"{content}\"\"\"

Maintain meaning but update style, pacing, and voice.

Return JSON: {{"converted": "..."}}"""

    res = await call_groq_async(prompt)
    return res.choices[0].message.content


@mcp.tool()
async def refine_content(
    content: str,
    tone: str = "engaging",
    use_web_search: bool = True
) -> dict:
    """
    Refines user-provided content using Groq LLM, optionally using web search.

    Parameters:
    - content: original text to refine
    - tone: desired tone (professional, friendly, casual, marketing, etc.)
      Defaults to "engaging".
    - use_web_search: If True, fetch relevant context via web search (Tavily).

    Returns:
    - refined content as string
    """

    logger.info(f"Refining content with tone: {tone}, web_search={use_web_search}")

    # --------------------------------------
    # Optional Web Search
    # --------------------------------------
    web_context = ""
    if use_web_search:
        try:
            result = tavily.search(
                query=f"latest info, trends, or insights related to: {content}",
                search_depth="basic",
                include_answer=True,
                max_results=5
            )
            web_context = result.get("answer", "")
        except Exception as e:
            logger.error(f"Tavily search failed: {e}")
            web_context = f"(Web search failed: {e})"

    # --------------------------------------
    # LLM Prompt
    # --------------------------------------
    prompt = f"""
You are a professional content editor. Refine the following text to make it polished, clear, and compelling.

Tone: {tone}

Original content:
"{content}"

{"Relevant context from web search:\n" + web_context if web_context else ""}

Requirements:
- Keep the meaning intact.
- Improve flow, grammar, and readability.
- Make it engaging, persuasive, or professional according to the tone.
- Keep it concise and human-like.
Return only the refined content as text.
"""

    # Call Groq LLM
    response = await call_groq_async(prompt)
    refined_text = response.choices[0].message.content

    return {
        "original_content": content,
        "tone": tone,
        "web_context_used": bool(web_context),
        "refined_content": refined_text
    }


@mcp.tool()
async def get_trending_headlines(
    niche: str | None = None,
    use_web_search: bool = True
) -> dict:
    """
    Returns the top 5 trending headlines for today. 

    - Optionally filter by niche (e.g., tech, sports, entertainment).
    - Uses Tavily web search to fetch trending content.
    - Returns a clean structured JSON with headlines and source URLs.
    """

    if not use_web_search:
        return {"error": "Web search is disabled. Enable `use_web_search=True` to fetch trends."}

    search_query = "trending news"
    if niche:
        search_query += f" in {niche}"

    logger.info(f"Fetching trending headlines for: {search_query}")

    web_context = ""
    try:
        # Perform Tavily search
        result = tavily.search(
            query=search_query,
            search_depth="basic",
            include_answer=True,
            max_results=5
        )
        web_context = result.get("answer", "")
    except Exception as e:
        logger.error(f"Tavily search failed: {e}")
        return {"error": f"Tavily search failed: {e}"}

    # Optional: Split into top 5 headlines (if multiple lines returned)
    headlines = []
    for line in web_context.split("\n"):
        line = line.strip()
        if line:
            headlines.append(line)
        if len(headlines) >= 5:
            break

    return {
        "niche": niche or "general",
        "top_5_trending_headlines": headlines
    }


def _normalize_emails(emails):
    if isinstance(emails, str):
        return [e.strip() for e in emails.split(",") if e.strip()]
    elif isinstance(emails, list):
        return emails
    return []

@mcp.tool()
async def generate_social_content(
    topic: str,
    content_type: str = "reel",  # "reel" or "post"
    tone: str = "engaging",
    use_web_search: bool = False
) -> dict:
    """
    Generates social media content for Reels or Posts using Groq LLM (GPT-OSS 120B),
    with optional Tavily web search.

    Reel format:
        - Hook
        - Body (short, fast-paced)
        - CTA (subscribe/follow in that topic style)
        - Description
        - 40-50 viral, relevant hashtags

    Post format:
        - Catchy caption
        - Description
        - 40-50 viral, relevant hashtags
    """

    logger.info(f"Generating social content of type '{content_type}'")

    # --------------------------------------
    # Optional Tavily Web Search
    # --------------------------------------
    web_context = ""

    if use_web_search:
        try:
            result = tavily.search(
                query=f"{topic} latest news trends facts insights social media buzz",
                search_depth="basic",
                include_answer=True,
                max_results=5
            )
            web_context = result.get("answer", "")
        except Exception as e:
            logger.error(f"Tavily search failed: {e}")
            web_context = f"(Web search failed: {e})"

    # --------------------------------------
    # LLM Prompt Based on Type
    # --------------------------------------
    if content_type.lower() == "reel":
        format_instructions = """
Create REEL content in this exact structure (short punchy lines):

1. Hook (1 strong line, viral style)
2. Body (5–7 lines)
    BODY FORMAT RULE:
    - Output EXACTLY one paragraph.
    - 3–5 sentences, no bullets, no new lines.
    - No asterisks (*), no hyphens (-), no breaks.
    - The paragraph must flow continuously like a short news story.
3. CTA: a compelling call-to-action telling viewers to follow/subscribe for more on this topic
4. Description (2–4 lines)
5. 40–50 viral, niche-relevant hashtags separated by spaces (no numbering)

**STYLE EXAMPLE TO IMITATE**
Hook:
"Did you know the last US pennies ever minted could fetch up to $5 million each? Let’s find out why!"

Body:
"The US Treasury recently ended penny production, striking just five final pennies — each stamped with a rare omega mark to symbolize the end of more than 230 years of minting. Around 232 of these omega pennies were minted in total by the Philadelphia Mint, one for each year the penny was produced plus a few for display. These special pennies won't go into circulation but will be auctioned to collectors, with prices estimated between $2 million and $5 million each. All proceeds from the auction will go to the US Treasury’s general fund. Meanwhile, about 300 billion pennies remain in circulation and will gradually phase out over time."

CTA:
"If you want to catch the auction or learn more about rare coins, hit that follow and don’t miss the next big coin story!"


Return structured JSON with keys:
- hook
- body
- cta
- description
- hashtags
"""
    else:  # POST content
        format_instructions = """
Create POST content:

1. A catchy, trendy caption (1–2 lines)
2. A descriptive text (5-7 lines)
3. 40–50 viral, niche-relevant hashtags separated by spaces (no numbering)

Return structured JSON with keys:
- caption
- description
- hashtags
"""

    # --------------------------------------
    # Final Prompt
    # --------------------------------------
    prompt = f"""
Generate social media content for the topic: "{topic}"

Tone: {tone}

{"Relevant research:\n" + web_context if web_context else ""}

Follow these instructions:
{format_instructions}

Voice style:
- highly engaging
- punchy
- scroll-stopping
- human-like
- trending in 2025

Don't include emojis unless they elevate the content naturally.
"""

    # --------------------------------------
    # Call Groq LLM
    # --------------------------------------
    response = await call_groq_async(prompt)
    llm_output = response.choices[0].message.content

    return {
        "topic": topic,
        "type": content_type,
        "generated": llm_output
    }


@mcp.tool()
async def generate_email_with_llm(
    emails: str | list,
    topic: str,
    details: str | None = None,
    tone: str = "professional",
    cc: str | list | None = None,
    bcc: str | list | None = None,
    use_web_search: bool = False,
    company : str | None = None
    #model: str = "openai/gpt-oss-120b"
) -> dict:
    """
    Uses Groq's GPT-OSS 120B model to create a full email:
    - Auto formats recipients (to, cc, bcc)
    - Auto generates subject
    - Generates a polished email body
    - Supports tone: professional / friendly / marketing / strict / casual
    """

    logger.info("Generating email using LLM (Groq GPT-OSS 120B)")

    # Normalize recipients
    to_list = _normalize_emails(emails)
    cc_list = _normalize_emails(cc) if cc else ["team@company.com"]
    bcc_list = _normalize_emails(bcc) if bcc else ["records@company.com"]

    web_data = ""

    if use_web_search:
        try:
            result = tavily.search(
                query=f"{company} latest news hiring funding products",
                search_depth="basic",
                include_answer=True,
                max_results=5
            )
            web_data = result.get("answer", "")
        except Exception as e:
            web_data = f"(Web search failed: {e})"

    # Build the LLM prompt
    prompt = f"""
Write an email with the following details:

Topic: {topic}
Tone: {tone}
Extra Details: {details}
{f"Company research:\n{web_data}" if web_data else ""}

Return the result in structured JSON with:
- subject
- body

The voice should be clean, polished, human-like, and concise.
Include a polite thank-you / signoff.
Sign as: Sanjit.
"""

    # Call Groq
    response = await call_groq_async(prompt)
    llm_output = response.choices[0].message.content

    return {
        "recipients": {
            "to": to_list,
            "cc": cc_list,
            "bcc": bcc_list
        },
        "generated": llm_output  # This will contain subject + body from model
    }

# @mcp.tool()
# def generate_md5_hash(input_str: str) -> str:
#     logger.info(f"Generating MD5 hash for: {input_str}")
#     md5_hash = hashlib.md5()
#     md5_hash.update(input_str.encode("utf-8"))
#     return md5_hash.hexdigest()

# @mcp.tool()
# def count_characters(input_str: str) -> int:
#     logger.info(f"Counting characters in: {input_str}")
#     return len(input_str)

# @mcp.tool()
# def get_first_half(input_str: str) -> str:
#     logger.info(f"Getting first half of: {input_str}")
#     midpoint = len(input_str) // 2
#     return input_str[:midpoint]

# @mcp.tool()
# def add_numbers(a: int, b: int) -> int:
#     logger.info(f"Adding 2 numbers: {a,b}")
#     return a + b 

# @mcp.tool()
# async def define_word(word: str) -> str:
#     url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
#     async with aiohttp.ClientSession() as session:
#         async with session.get(url) as resp:
#             if resp.status != 200:
#                 return f"❌ Word not found: {word}"
#             data = await resp.json()
#             meanings = data[0]["meanings"]
#             defs = [m["definitions"][0]["definition"] for m in meanings]
#             return f"Definitions for {word}: " + "; ".join(defs)

# @mcp.tool()
# def util_min(num1: Any, num2: Any) -> str:
#     """
#     Returns the syntax Util.MIN(num1, num2) for expressing a minimum operation.
#     """
#     return f"UTIL.MIN({num1}, {num2})"



# # 🌦️ Weather tool (OpenWeather API)
# @mcp.tool()
# async def get_weather(city: str, api_key: str = "299560237473ced6f2a919e53a8153af") -> str:
#     """
#     Get current weather for a given city using OpenWeather API.
#     Requires an API key (https://openweathermap.org/api).
#     """
#     if not api_key:
#         return "❌ No API key provided for OpenWeather."

#     url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"

#     async with aiohttp.ClientSession() as session:
#         async with session.get(url) as resp:
#             if resp.status != 200:
#                 return f"❌ Error fetching weather: {resp.status}"
#             data = await resp.json()
#             temp = data["main"]["temp"]
#             condition = data["weather"][0]["description"]
#             return f"The weather in {city} is {condition} with {temp}°C."
        
# # 💱 Currency conversion tool (ExchangeRate.host API)
# @mcp.tool()
# async def convert_currency(amount: float, from_currency: str, to_currency: str) -> str:
#     """
#     Convert currency using real-time rates from ExchangeRate.host.
#     """
#     url = f"https://api.exchangerate.host/convert?from={from_currency}&to={to_currency}&amount={amount}"

#     async with aiohttp.ClientSession() as session:
#         async with session.get(url) as resp:
#             if resp.status != 200:
#                 return f"❌ Error fetching conversion rate: {resp.status}"
#             data = await resp.json()
#             result = data.get("result")
#             if result is None:
#                 return f"❌ Could not convert {amount} {from_currency} to {to_currency}"
#             return f"{amount} {from_currency.upper()} = {result:.2f} {to_currency.upper()}"

if __name__ == "__main__":
    # Run via stdio transport
    mcp.run(transport="stdio")
