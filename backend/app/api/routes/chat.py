"""
Chat API routes for SustainaPath.
Manages conversation state and delegates to Claude service.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.claude_service import chat as claude_chat

router = APIRouter()


class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    goal: Optional[str] = "balanced"  # sustainability | cost | time | balanced


class ChatResponse(BaseModel):
    type: str  # "clarifying" | "analysis"
    data: Optional[dict] = None
    message: Optional[str] = None
    questions: Optional[List[str]] = None


@router.post("/chat", response_model=dict)
async def chat_endpoint(req: ChatRequest):
    """
    Main chat endpoint. Accepts conversation history and returns either:
    - Clarifying questions (type: "clarifying")
    - Full process analysis (type: "analysis")
    """
    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    # Convert Pydantic models to dicts for the Claude service
    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    try:
        result = claude_chat(messages, goal=req.goal or "balanced")
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/health")
def health():
    return {"status": "ok", "service": "SustainaPath API v2"}
