# Task T011-T013: MCP Server for Phase III AI Chatbot
# Phase V: Enhanced with event publishing for event-driven architecture
# Exposes task operations as standardized MCP tools for AI agent
import logging
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlmodel import Session, select
from ..database import engine
from ..models.task import Task
from .event_publisher import publish_task_event, publish_task_update, schedule_reminder, cancel_reminder

logger = logging.getLogger(__name__)


class MCPTools:
    """
    MCP (Model Context Protocol) tools that expose task operations
    to the AI agent. All tools enforce user_id validation for security.
    """

    @staticmethod
    async def add_task(
        user_id: int,
        title: str,
        description: Optional[str] = None,
        priority: str = "medium",
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        due_date: Optional[str] = None,
        remind_before_minutes: int = 30,
        is_recurring: bool = False,
        recurrence_pattern: Optional[Dict[str, Any]] = None,
        parent_task_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Create a new task for the user.

        Args:
            user_id: ID of the user creating the task (required for isolation)
            title: Task title (required)
            description: Optional task description
            priority: Task priority - "low", "medium", or "high" (default: "medium")
            category: Optional task category
            tags: Optional list of tags for organizing tasks
            due_date: Optional due date in ISO format
            remind_before_minutes: Minutes before due date to send reminder (default: 30)
            is_recurring: Whether this is a recurring task (default: False)
            recurrence_pattern: Recurrence pattern dict (e.g., {"type": "daily", "interval": 1})
            parent_task_id: ID of parent task if this is a recurring instance

        Returns:
            Dict with task_id, status, and title
        """
        try:
            with Session(engine) as session:
                # Parse due_date if provided
                parsed_due_date = None
                if due_date:
                    try:
                        parsed_due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                    except ValueError:
                        logger.warning(f"Invalid due_date format: {due_date}")

                task = Task(
                    title=title,
                    owner_id=user_id,
                    priority=priority,
                    category=category,
                    tags=tags,
                    due_date=parsed_due_date,
                    remind_before_minutes=remind_before_minutes,
                    is_recurring=is_recurring,
                    recurrence_pattern=recurrence_pattern,
                    parent_task_id=parent_task_id,
                    is_completed=False
                )
                session.add(task)
                session.commit()
                session.refresh(task)

                # Prepare task data for events
                task_data = {
                    "id": task.id,
                    "title": task.title,
                    "description": description,
                    "priority": task.priority,
                    "category": task.category,
                    "tags": task.tags,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "remind_before_minutes": task.remind_before_minutes,
                    "is_recurring": task.is_recurring,
                    "recurrence_pattern": task.recurrence_pattern,
                    "parent_task_id": task.parent_task_id,
                    "is_completed": task.is_completed,
                    "created_at": task.created_at.isoformat() if task.created_at else None
                }

                # Publish events (Phase V)
                await publish_task_event("created", task.id, user_id, task_data)
                await publish_task_update(user_id, task.id, "created", task_data)

                # Schedule reminder if due_date is set
                if task.due_date:
                    await schedule_reminder(
                        task.id,
                        user_id,
                        task.title,
                        task.due_date,
                        task.remind_before_minutes
                    )

                logger.info(f"Created task {task.id} for user {user_id}")
                return {
                    "task_id": task.id,
                    "status": "success",
                    "title": task.title,
                    "priority": task.priority,
                    "category": task.category,
                    "tags": task.tags,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "is_recurring": task.is_recurring
                }
        except Exception as e:
            logger.error(f"Error creating task: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to create task: {str(e)}"
            }

    @staticmethod
    def list_tasks(
        user_id: int,
        status: Optional[str] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        List all tasks for the user, optionally filtered by status.

        Args:
            user_id: ID of the user (required for isolation)
            status: Optional filter - "completed" or "pending"
            limit: Maximum number of tasks to return (default: 100)

        Returns:
            Dict with tasks array and count
        """
        try:
            with Session(engine) as session:
                query = select(Task).where(Task.owner_id == user_id)

                # Apply status filter if provided
                if status == "completed":
                    query = query.where(Task.is_completed == True)
                elif status == "pending":
                    query = query.where(Task.is_completed == False)

                # Apply limit
                query = query.limit(limit)

                tasks = session.exec(query).all()

                task_list = [
                    {
                        "id": task.id,
                        "title": task.title,
                        "is_completed": task.is_completed,
                        "priority": task.priority,
                        "category": task.category,
                        "tags": task.tags,
                        "created_at": task.created_at.isoformat() if task.created_at else None
                    }
                    for task in tasks
                ]

                logger.info(f"Listed {len(task_list)} tasks for user {user_id}")
                return {
                    "status": "success",
                    "tasks": task_list,
                    "count": len(task_list)
                }
        except Exception as e:
            logger.error(f"Error listing tasks: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to list tasks: {str(e)}"
            }

    @staticmethod
    async def complete_task(user_id: int, task_id: int) -> Dict[str, Any]:
        """
        Mark a task as completed.

        Args:
            user_id: ID of the user (required for isolation)
            task_id: ID of the task to complete

        Returns:
            Dict with task_id, status, and title
        """
        try:
            with Session(engine) as session:
                task = session.get(Task, task_id)

                if not task:
                    return {
                        "status": "error",
                        "message": f"Task {task_id} not found"
                    }

                # Validate user ownership
                if task.owner_id != user_id:
                    return {
                        "status": "error",
                        "message": "You don't have permission to complete this task"
                    }

                task.is_completed = True
                session.add(task)
                session.commit()
                session.refresh(task)

                # Prepare task data for events
                task_data = {
                    "id": task.id,
                    "title": task.title,
                    "priority": task.priority,
                    "category": task.category,
                    "tags": task.tags,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "remind_before_minutes": task.remind_before_minutes,
                    "is_recurring": task.is_recurring,
                    "recurrence_pattern": task.recurrence_pattern,
                    "parent_task_id": task.parent_task_id,
                    "is_completed": task.is_completed
                }

                # Publish events (Phase V)
                await publish_task_event("completed", task.id, user_id, task_data)
                await publish_task_update(user_id, task.id, "completed", task_data)

                # Cancel reminder if it exists
                if task.due_date:
                    await cancel_reminder(task.id)

                logger.info(f"Completed task {task_id} for user {user_id}")
                return {
                    "task_id": task.id,
                    "status": "success",
                    "title": task.title,
                    "is_completed": task.is_completed
                }
        except Exception as e:
            logger.error(f"Error completing task: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to complete task: {str(e)}"
            }

    @staticmethod
    async def delete_task(user_id: int, task_id: int) -> Dict[str, Any]:
        """
        Delete a task.

        Args:
            user_id: ID of the user (required for isolation)
            task_id: ID of the task to delete

        Returns:
            Dict with task_id and status
        """
        try:
            with Session(engine) as session:
                task = session.get(Task, task_id)

                if not task:
                    return {
                        "status": "error",
                        "message": f"Task {task_id} not found"
                    }

                # Validate user ownership
                if task.owner_id != user_id:
                    return {
                        "status": "error",
                        "message": "You don't have permission to delete this task"
                    }

                # Prepare task data for events before deletion
                task_data = {
                    "id": task.id,
                    "title": task.title,
                    "priority": task.priority,
                    "category": task.category,
                    "tags": task.tags,
                    "is_completed": task.is_completed
                }

                title = task.title
                had_reminder = task.due_date is not None

                session.delete(task)
                session.commit()

                # Publish events (Phase V)
                await publish_task_event("deleted", task_id, user_id, task_data)
                await publish_task_update(user_id, task_id, "deleted", task_data)

                # Cancel reminder if it existed
                if had_reminder:
                    await cancel_reminder(task_id)

                logger.info(f"Deleted task {task_id} for user {user_id}")
                return {
                    "task_id": task_id,
                    "status": "success",
                    "title": title,
                    "message": f"Task '{title}' has been deleted"
                }
        except Exception as e:
            logger.error(f"Error deleting task: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to delete task: {str(e)}"
            }

    @staticmethod
    async def update_task(
        user_id: int,
        task_id: int,
        title: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        due_date: Optional[str] = None,
        remind_before_minutes: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Update task details.

        Args:
            user_id: ID of the user (required for isolation)
            task_id: ID of the task to update
            title: New task title (optional)
            priority: New task priority (optional)
            category: New task category (optional)
            tags: New list of tags (optional)
            due_date: New due date in ISO format (optional)
            remind_before_minutes: New reminder time in minutes (optional)

        Returns:
            Dict with task_id, status, and updated fields
        """
        try:
            with Session(engine) as session:
                task = session.get(Task, task_id)

                if not task:
                    return {
                        "status": "error",
                        "message": f"Task {task_id} not found"
                    }

                # Validate user ownership
                if task.owner_id != user_id:
                    return {
                        "status": "error",
                        "message": "You don't have permission to update this task"
                    }

                # Store before state for audit
                before_state = {
                    "title": task.title,
                    "priority": task.priority,
                    "category": task.category,
                    "tags": task.tags,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "remind_before_minutes": task.remind_before_minutes
                }

                # Update fields if provided
                old_due_date = task.due_date
                if title is not None:
                    task.title = title
                if priority is not None:
                    task.priority = priority
                if category is not None:
                    task.category = category
                if tags is not None:
                    task.tags = tags
                if due_date is not None:
                    try:
                        task.due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                    except ValueError:
                        logger.warning(f"Invalid due_date format: {due_date}")
                if remind_before_minutes is not None:
                    task.remind_before_minutes = remind_before_minutes

                session.add(task)
                session.commit()
                session.refresh(task)

                # Prepare after state
                after_state = {
                    "title": task.title,
                    "priority": task.priority,
                    "category": task.category,
                    "tags": task.tags,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "remind_before_minutes": task.remind_before_minutes
                }

                # Prepare task data for events
                task_data = {
                    "id": task.id,
                    "title": task.title,
                    "priority": task.priority,
                    "category": task.category,
                    "tags": task.tags,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "remind_before_minutes": task.remind_before_minutes,
                    "is_recurring": task.is_recurring,
                    "recurrence_pattern": task.recurrence_pattern,
                    "is_completed": task.is_completed,
                    "before": before_state,
                    "after": after_state
                }

                # Publish events (Phase V)
                await publish_task_event("updated", task.id, user_id, task_data)
                await publish_task_update(user_id, task.id, "updated", task_data)

                # Handle reminder updates
                if old_due_date != task.due_date or remind_before_minutes is not None:
                    # Cancel old reminder
                    if old_due_date:
                        await cancel_reminder(task.id)
                    # Schedule new reminder
                    if task.due_date:
                        await schedule_reminder(
                            task.id,
                            user_id,
                            task.title,
                            task.due_date,
                            task.remind_before_minutes
                        )

                logger.info(f"Updated task {task_id} for user {user_id}")
                return {
                    "task_id": task.id,
                    "status": "success",
                    "title": task.title,
                    "priority": task.priority,
                    "category": task.category,
                    "tags": task.tags,
                    "due_date": task.due_date.isoformat() if task.due_date else None
                }
        except Exception as e:
            logger.error(f"Error updating task: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to update task: {str(e)}"
            }
