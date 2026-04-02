from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.auth import get_current_user, get_db
from app.models import Chat, Message, User
from app.services.ai_assistant import extract_metrics_from_description

router = APIRouter()

# 🟢 Create a new chat session
@router.post("/chats/new")
def new_chat(title: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chat = Chat(title=title, user_id=user.id)
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return {"chat_id": chat.id, "title": chat.title}


# 🟢 Get all chats for current user
@router.get("/chats")
def get_user_chats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chats = db.query(Chat).filter(Chat.user_id == user.id).order_by(Chat.updated_at.desc()).all()
    return [{"id": c.id, "title": c.title, "updated_at": c.updated_at} for c in chats]


# 🟢 Get all messages for a specific chat
@router.get("/chats/{chat_id}")
def get_chat_messages(chat_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return [
        {"sender": m.sender, "content": m.content, "timestamp": m.timestamp}
        for m in chat.messages
    ]


# 🟢 Send message and get AI response
@router.post("/chats/{chat_id}/message")
def send_message(chat_id: int, message: str, goal: str = "sustainability", db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Save user message
    user_msg = Message(chat_id=chat.id, sender="user", content=message)
    db.add(user_msg)

    # Get AI response
    result = extract_metrics_from_description(message, goal)
    chem = result.get("chem_metrics", {})
    proc = result.get("process_metrics", {})
    recs = result.get("recommendations", "No suggestions returned.")

    # Compose assistant reply
    response = ""
    if goal == "sustainability":
        from app.core.scoring import calculate_sustainability_score
        score = calculate_sustainability_score(chem, proc)
        response += f"♻️ Sustainability Score: {score}/100\n\n"
    response += recs.strip()

    # Save assistant message
    bot_msg = Message(chat_id=chat.id, sender="assistant", content=response)
    db.add(bot_msg)

    # Update chat time
    chat.updated_at = datetime.utcnow()
    db.commit()

    return {"response": response}
