"""
Integration test configuration with PostgreSQL
"""
import pytest
import os
from sqlmodel import Session, create_engine, SQLModel
from fastapi.testclient import TestClient
from src.main import app
from src.database import get_db
from src.models.user import User
from src.models.task import Task
from src.models.conversation import Conversation
from src.models.message import Message


# PostgreSQL test database URL
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/todo_test"
)


@pytest.fixture(scope="session")
def engine():
    """Create a test database engine for the entire test session"""
    test_engine = create_engine(TEST_DATABASE_URL, echo=False)

    # Create all tables
    SQLModel.metadata.create_all(test_engine)

    yield test_engine

    # Drop all tables after tests
    SQLModel.metadata.drop_all(test_engine)
    test_engine.dispose()


@pytest.fixture(scope="function")
def session(engine):
    """Create a new database session for each test"""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(session: Session):
    """Create a test client with database session override"""
    def get_session_override():
        return session

    app.dependency_overrides[get_db] = get_session_override

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def test_user(session: Session):
    """Create a test user"""
    from src.auth import get_password_hash

    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("TestPassword123!")
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@pytest.fixture
def auth_token(client: TestClient, test_user: User):
    """Get authentication token for test user"""
    response = client.post(
        "/api/login",
        data={
            "username": test_user.email,
            "password": "TestPassword123!"
        }
    )

    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token: str):
    """Get authorization headers with token"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def test_task(session: Session, test_user: User):
    """Create a test task"""
    task = Task(
        title="Test Task",
        is_completed=False,
        priority="medium",
        owner_id=test_user.id,
        tags=["test"],
        subtasks=[]
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    return task


@pytest.fixture
def test_conversation(session: Session, test_user: User):
    """Create a test conversation"""
    conversation = Conversation(
        user_id=test_user.id
    )
    session.add(conversation)
    session.commit()
    session.refresh(conversation)

    return conversation


@pytest.fixture
def test_message(session: Session, test_conversation: Conversation):
    """Create a test message"""
    message = Message(
        conversation_id=test_conversation.id,
        role="user",
        content="Test message"
    )
    session.add(message)
    session.commit()
    session.refresh(message)

    return message
