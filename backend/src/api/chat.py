# Task T015: Chat API endpoint for Phase III AI Chatbot
# Handles conversation flow: validate JWT, manage conversation, run agent, persist messages
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging

from .. import models
from ..database import engine
from ..auth import get_current_user
from ..services.agent_service import run_agent

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatRequest(BaseModel):
    """Request body for chat endpoint"""
    message: str
    conversation_id: Optional[int] = None


class ChatResponse(BaseModel):
    """Response body for chat endpoint"""
    message: str
    conversation_id: int


def get_db():
    """Get database session"""
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not configured."
        )
    with Session(engine) as session:
        yield session


@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Process a chat message and return AI assistant response.

    Flow:
    1. Get or create conversation
    2. Load conversation history
    3. Save user message
    4. Run AI agent
    5. Save assistant response
    6. Return response
    """
    try:
        # Step 1: Get or create conversation
        if request.conversation_id:
            # Verify conversation belongs to user
            statement = select(models.Conversation).where(
                models.Conversation.id == request.conversation_id,
                models.Conversation.user_id == current_user.id
            )
            conversation = db.exec(statement).first()

            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )
        else:
            # Create new conversation
            conversation = models.Conversation(user_id=current_user.id)
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            logger.info(f"Created new conversation: id={conversation.id}, user_id={current_user.id}")

        # Step 2: Load conversation history (last 50 messages)
        history_statement = select(models.Message).where(
            models.Message.conversation_id == conversation.id
        ).order_by(models.Message.created_at).limit(50)

        history_messages = db.exec(history_statement).all()

        # Convert to format expected by agent
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in history_messages
        ]

        # Step 3: Save user message
        user_message = models.Message(
            conversation_id=conversation.id,
            role="user",
            content=request.message
        )
        db.add(user_message)
        db.commit()
        logger.info(f"Saved user message: conversation_id={conversation.id}")

        # Step 4: Run AI agent
        assistant_response = run_agent(
            user_id=current_user.id,
            message=request.message,
            conversation_history=conversation_history
        )

        # Step 5: Save assistant response
        assistant_message = models.Message(
            conversation_id=conversation.id,
            role="assistant",
            content=assistant_response
        )
        db.add(assistant_message)

        # Update conversation updated_at timestamp
        conversation.updated_at = datetime.utcnow()
        db.add(conversation)

        db.commit()
        logger.info(f"Saved assistant message: conversation_id={conversation.id}")

        # Step 6: Return response
        return ChatResponse(
            message=assistant_response,
            conversation_id=conversation.id
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )


@router.get("/conversations")
def list_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    List all conversations for the current user.
    """
    try:
        statement = select(models.Conversation).where(
            models.Conversation.user_id == current_user.id
        ).order_by(models.Conversation.updated_at.desc())

        conversations = db.exec(statement).all()

        return {
            "conversations": [
                {
                    "id": conv.id,
                    "created_at": conv.created_at.isoformat(),
                    "updated_at": conv.updated_at.isoformat()
                }
                for conv in conversations
            ]
        }
    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing conversations: {str(e)}"
        )


@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all messages for a specific conversation.
    """
    try:
        # Verify conversation belongs to user
        conv_statement = select(models.Conversation).where(
            models.Conversation.id == conversation_id,
            models.Conversation.user_id == current_user.id
        )
        conversation = db.exec(conv_statement).first()

        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )

        # Get messages
        msg_statement = select(models.Message).where(
            models.Message.conversation_id == conversation_id
        ).order_by(models.Message.created_at)

        messages = db.exec(msg_statement).all()

        return {
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat()
                }
                for msg in messages
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation messages: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting messages: {str(e)}"
        )
