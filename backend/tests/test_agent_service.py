# Task T047: Unit tests for agent service
# Tests for Phase III AI Chatbot agent orchestration with Google Gemini
import pytest
from unittest.mock import Mock, patch, MagicMock
from src.services.agent_service import run_agent


class TestAgentService:
    """Test suite for Gemini agent service"""

    @patch('src.services.agent_service.client')
    @patch('src.services.agent_service.MCPTools')
    def test_run_agent_simple_response(self, mock_mcp_tools, mock_client):
        """Test agent with simple response (no tool calls)"""
        # Arrange - Mock Gemini response without function calls
        mock_candidate = MagicMock()
        mock_candidate.content.parts = [MagicMock()]
        mock_candidate.content.parts[0].text = "Hello! How can I help you?"
        # No function_call attribute means no tool calls
        delattr(mock_candidate.content.parts[0], 'function_call')

        mock_response = MagicMock()
        mock_response.candidates = [mock_candidate]
        mock_response.text = "Hello! How can I help you?"

        mock_client.models.generate_content.return_value = mock_response

        # Act
        result = run_agent(user_id=1, message="Hello")

        # Assert
        assert result == "Hello! How can I help you?"
        mock_client.models.generate_content.assert_called_once()

    @patch('src.services.agent_service.client')
    @patch('src.services.agent_service.MCPTools')
    def test_run_agent_with_tool_call_add_task(self, mock_mcp_tools, mock_client):
        """Test agent calling add_task tool"""
        # Arrange
        # First response with function call
        mock_func_call = MagicMock()
        mock_func_call.name = "add_task"
        mock_func_call.args = {"title": "Buy groceries"}

        mock_part_with_func = MagicMock()
        mock_part_with_func.function_call = mock_func_call

        mock_first_candidate = MagicMock()
        mock_first_candidate.content.parts = [mock_part_with_func]

        mock_first_response = MagicMock()
        mock_first_response.candidates = [mock_first_candidate]
        mock_first_response.text = None

        # Second response after tool execution
        mock_second_candidate = MagicMock()
        mock_second_part = MagicMock()
        delattr(mock_second_part, 'function_call')
        mock_second_candidate.content.parts = [mock_second_part]

        mock_second_response = MagicMock()
        mock_second_response.candidates = [mock_second_candidate]
        mock_second_response.text = "I've added 'Buy groceries' to your tasks!"

        mock_client.models.generate_content.side_effect = [mock_first_response, mock_second_response]

        # Mock MCP tool response
        mock_mcp_tools.add_task.return_value = {"success": True, "task_id": 1}

        # Act
        result = run_agent(user_id=1, message="Add buy groceries")

        # Assert
        assert "Buy groceries" in result or "added" in result.lower()
        assert mock_client.models.generate_content.call_count == 2

    @patch('src.services.agent_service.client')
    @patch('src.services.agent_service.MCPTools')
    def test_run_agent_with_tool_call_list_tasks(self, mock_mcp_tools, mock_client):
        """Test agent calling list_tasks tool"""
        # Arrange
        # First response with function call
        mock_func_call = MagicMock()
        mock_func_call.name = "list_tasks"
        mock_func_call.args = {}

        mock_part_with_func = MagicMock()
        mock_part_with_func.function_call = mock_func_call

        mock_first_candidate = MagicMock()
        mock_first_candidate.content.parts = [mock_part_with_func]

        mock_first_response = MagicMock()
        mock_first_response.candidates = [mock_first_candidate]
        mock_first_response.text = None

        # Second response after tool execution
        mock_second_candidate = MagicMock()
        mock_second_part = MagicMock()
        delattr(mock_second_part, 'function_call')
        mock_second_candidate.content.parts = [mock_second_part]

        mock_second_response = MagicMock()
        mock_second_response.candidates = [mock_second_candidate]
        mock_second_response.text = "Here are your tasks: 1. Buy groceries"

        mock_client.models.generate_content.side_effect = [mock_first_response, mock_second_response]

        # Mock MCP tool response
        mock_mcp_tools.list_tasks.return_value = {
            "success": True,
            "tasks": [{"id": 1, "title": "Buy groceries"}]
        }

        # Act
        result = run_agent(user_id=1, message="What are my tasks?")

        # Assert
        assert "tasks" in result.lower() or "Buy groceries" in result
        assert mock_client.models.generate_content.call_count == 2

    @patch('src.services.agent_service.client')
    @patch('src.services.agent_service.MCPTools')
    def test_run_agent_with_conversation_history(self, mock_mcp_tools, mock_client):
        """Test agent with conversation history"""
        # Arrange
        conversation_history = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi! How can I help?"}
        ]

        mock_candidate = MagicMock()
        mock_part = MagicMock()
        delattr(mock_part, 'function_call')
        mock_candidate.content.parts = [mock_part]

        mock_response = MagicMock()
        mock_response.candidates = [mock_candidate]
        mock_response.text = "Sure, I can help with that!"

        mock_client.models.generate_content.return_value = mock_response

        # Act
        result = run_agent(user_id=1, message="Can you help me?", conversation_history=conversation_history)

        # Assert
        assert result == "Sure, I can help with that!"
        # Verify conversation history was included in the call
        call_args = mock_client.models.generate_content.call_args
        assert call_args is not None

    @patch('src.services.agent_service.client')
    def test_run_agent_error_handling(self, mock_client):
        """Test agent error handling"""
        # Arrange
        mock_client.models.generate_content.side_effect = Exception("API Error")

        # Act
        result = run_agent(user_id=1, message="Hello")

        # Assert
        assert "error" in result.lower() or "sorry" in result.lower()

    @patch('src.services.agent_service.client')
    @patch('src.services.agent_service.MCPTools')
    def test_run_agent_multiple_tool_calls(self, mock_mcp_tools, mock_client):
        """Test agent making multiple tool calls in sequence"""
        # Arrange
        # First response with list_tasks call
        mock_func_call_1 = MagicMock()
        mock_func_call_1.name = "list_tasks"
        mock_func_call_1.args = {}

        mock_part_1 = MagicMock()
        mock_part_1.function_call = mock_func_call_1

        mock_candidate_1 = MagicMock()
        mock_candidate_1.content.parts = [mock_part_1]

        mock_response_1 = MagicMock()
        mock_response_1.candidates = [mock_candidate_1]
        mock_response_1.text = None

        # Second response with complete_task call
        mock_func_call_2 = MagicMock()
        mock_func_call_2.name = "complete_task"
        mock_func_call_2.args = {"task_id": 1}

        mock_part_2 = MagicMock()
        mock_part_2.function_call = mock_func_call_2

        mock_candidate_2 = MagicMock()
        mock_candidate_2.content.parts = [mock_part_2]

        mock_response_2 = MagicMock()
        mock_response_2.candidates = [mock_candidate_2]
        mock_response_2.text = None

        # Final response
        mock_candidate_3 = MagicMock()
        mock_part_3 = MagicMock()
        delattr(mock_part_3, 'function_call')
        mock_candidate_3.content.parts = [mock_part_3]

        mock_response_3 = MagicMock()
        mock_response_3.candidates = [mock_candidate_3]
        mock_response_3.text = "Task completed successfully!"

        mock_client.models.generate_content.side_effect = [
            mock_response_1,
            mock_response_2,
            mock_response_3
        ]

        # Mock MCP tool responses
        mock_mcp_tools.list_tasks.return_value = {
            "success": True,
            "tasks": [{"id": 1, "title": "Buy groceries"}]
        }
        mock_mcp_tools.complete_task.return_value = {"success": True}

        # Act
        result = run_agent(user_id=1, message="Complete my first task")

        # Assert
        assert "completed" in result.lower() or "success" in result.lower()
        assert mock_client.models.generate_content.call_count == 3

    @patch('src.services.agent_service.client')
    @patch('src.services.agent_service.MCPTools')
    def test_run_agent_tool_returns_error(self, mock_mcp_tools, mock_client):
        """Test agent handling tool execution errors"""
        # Arrange
        # First response with function call
        mock_func_call = MagicMock()
        mock_func_call.name = "delete_task"
        mock_func_call.args = {"task_id": 999}

        mock_part_with_func = MagicMock()
        mock_part_with_func.function_call = mock_func_call

        mock_first_candidate = MagicMock()
        mock_first_candidate.content.parts = [mock_part_with_func]

        mock_first_response = MagicMock()
        mock_first_response.candidates = [mock_first_candidate]
        mock_first_response.text = None

        # Second response after tool execution
        mock_second_candidate = MagicMock()
        mock_second_part = MagicMock()
        delattr(mock_second_part, 'function_call')
        mock_second_candidate.content.parts = [mock_second_part]

        mock_second_response = MagicMock()
        mock_second_response.candidates = [mock_second_candidate]
        mock_second_response.text = "I couldn't find that task."

        mock_client.models.generate_content.side_effect = [mock_first_response, mock_second_response]

        # Mock MCP tool error response
        mock_mcp_tools.delete_task.return_value = {
            "success": False,
            "error": "Task not found"
        }

        # Act
        result = run_agent(user_id=1, message="Delete task 999")

        # Assert
        assert "couldn't" in result.lower() or "not found" in result.lower() or "find" in result.lower()
        assert mock_client.models.generate_content.call_count == 2

    def test_run_agent_no_client(self):
        """Test agent when Gemini client is not initialized"""
        # Arrange
        with patch('src.services.agent_service.client', None):
            # Act
            result = run_agent(user_id=1, message="Hello")

            # Assert
            assert "not properly configured" in result or "service" in result.lower()
