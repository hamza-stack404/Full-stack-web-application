# Task T015-T016: Chat API endpoints for Phase III AI Chatbot
# Handles chat interactions with JWT authentication and conversation persistence
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging

from ..auth import get_current_user, get_db
from ..models import User, Conversation, Message
from ..services.agent_service import run_agent

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response schemas
class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None


class ChatMessageResponse(BaseModel):
    response: str
    conversation_id: int
    message_id: int


class ConversationResponse(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime
    message_count: int


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime


@router.post("/chat/send", response_model=ChatMessageResponse)
def send_chat_message(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a chat message and get AI response.
    Creates a new conversation if conversation_id is not provided.
    """
    try:
        # Get or create conversation
        if request.conversation_id:
            conversation = db.get(Conversation, request.conversation_id)
            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )
            if conversation.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this conversation"
                )
        else:
            # Create new conversation
            conversation = Conversation(user_id=current_user.id)
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            logger.info(f"Created new conversation {conversation.id} for user {current_user.id}")

        # Save user message
        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=request.message
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)

        # Load conversation history (last 50 messages)
        history_query = select(Message).where(
            Message.conversation_id == conversation.id
        ).order_by(Message.created_at).limit(50)
        history_messages = db.exec(history_query).all()

        # Convert to format expected by agent
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in history_messages[:-1]  # Exclude the message we just added
        ]

        # Get AI response
        logger.info(f"Running agent for user {current_user.id} with message: {request.message[:50]}...")
        ai_response = run_agent(
            user_id=current_user.id,
            message=request.message,
            conversation_history=conversation_history
        )

        # Save assistant message
        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=ai_response
        )
        db.add(assistant_message)

        # Update conversation timestamp
        conversation.updated_at = datetime.utcnow()
        db.add(conversation)

        db.commit()
        db.refresh(assistant_message)

        logger.info(f"Chat interaction completed for conversation {conversation.id}")

        return ChatMessageResponse(
            response=ai_response,
            conversation_id=conversation.id,
            message_id=assistant_message.id
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your message"
        )


@router.get("/chat/conversations", response_model=List[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all conversations for the current user.
    """
    try:
        query = select(Conversation).where(
            Conversation.user_id == current_user.id
        ).order_by(Conversation.updated_at.desc())

        conversations = db.exec(query).all()

        # Get message count for each conversation
        result = []
        for conv in conversations:
            message_count_query = select(Message).where(
                Message.conversation_id == conv.id
            )
            message_count = len(db.exec(message_count_query).all())

            result.append(ConversationResponse(
                id=conv.id,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=message_count
            ))

        return result

    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving conversations"
        )


@router.get("/chat/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all messages for a specific conversation.
    """
    try:
        # Verify conversation exists and belongs to user
        conversation = db.get(Conversation, conversation_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        if conversation.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this conversation"
            )

        # Get messages
        query = select(Message).where(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at)

        messages = db.exec(query).all()

        return [
            MessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at
            )
            for msg in messages
        ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation messages: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving messages"
        )


@router.post("/chat/conversations", response_model=ConversationResponse)
def create_conversation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new conversation.
    """
    try:
        conversation = Conversation(user_id=current_user.id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        logger.info(f"Created conversation {conversation.id} for user {current_user.id}")

        return ConversationResponse(
            id=conversation.id,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            message_count=0
        )

    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the conversation"
        )


@router.delete("/chat/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a conversation and all its messages.
    """
    try:
        # Verify conversation exists and belongs to user
        conversation = db.get(Conversation, conversation_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        if conversation.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this conversation"
            )

        # Delete all messages first
        messages_query = select(Message).where(Message.conversation_id == conversation_id)
        messages = db.exec(messages_query).all()
        for message in messages:
            db.delete(message)

        # Delete conversation
        db.delete(conversation)
        db.commit()

        logger.info(f"Deleted conversation {conversation_id} for user {current_user.id}")

        return {"status": "success", "message": "Conversation deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the conversation"
        )
