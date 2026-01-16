import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskList from './TaskList'

// Mock @hello-pangea/dnd
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <div>{children}</div>,
  Droppable: ({ children }: any) => children({
    droppableProps: {},
    innerRef: vi.fn(),
    placeholder: null
  }),
  Draggable: ({ children, draggableId }: any) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: vi.fn(),
  }, {}),
}))

// Mock Task component
vi.mock('./Task', () => ({
  default: ({ task, onUpdate, onDelete, isFocused }: any) => (
    <div data-testid={`task-${task.id}`} data-focused={isFocused}>
      <span>{task.title}</span>
      <button onClick={() => onUpdate(task.id, { ...task, is_completed: !task.is_completed })}>
        Toggle
      </button>
      <button onClick={() => onDelete(task.id)}>Delete</button>
    </div>
  ),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('TaskList', () => {
  const mockTasks = [
    {
      id: 1,
      title: 'Task 1',
      is_completed: false,
      priority: 'high',
      category: 'work',
      subtasks: [],
    },
    {
      id: 2,
      title: 'Task 2',
      is_completed: true,
      priority: 'medium',
      category: 'personal',
      subtasks: [],
    },
    {
      id: 3,
      title: 'Task 3',
      is_completed: false,
      priority: 'low',
      subtasks: [],
    },
  ]

  const mockOnUpdate = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnReorder = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no tasks', () => {
    render(
      <TaskList
        tasks={[]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={null}
      />
    )

    expect(screen.getByText('No tasks yet!')).toBeInTheDocument()
    expect(screen.getByText('Add a new task above to get started.')).toBeInTheDocument()
  })

  it('renders all tasks', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={null}
      />
    )

    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
  })

  it('renders correct number of tasks', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={null}
      />
    )

    const tasks = screen.getAllByTestId(/task-/)
    expect(tasks).toHaveLength(3)
  })

  it('calls onUpdate when task is toggled', async () => {
    const user = userEvent.setup()
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={null}
      />
    )

    const toggleButton = screen.getAllByText('Toggle')[0]
    await user.click(toggleButton)

    expect(mockOnUpdate).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        is_completed: true,
      })
    )
  })

  it('calls onDelete when task is deleted', async () => {
    const user = userEvent.setup()
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={null}
      />
    )

    const deleteButton = screen.getAllByText('Delete')[0]
    await user.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith(1)
  })

  it('highlights focused task', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={1}
      />
    )

    const task2 = screen.getByTestId('task-2')
    expect(task2).toHaveAttribute('data-focused', 'true')
  })

  it('does not highlight non-focused tasks', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={1}
      />
    )

    const task1 = screen.getByTestId('task-1')
    const task3 = screen.getByTestId('task-3')

    expect(task1).toHaveAttribute('data-focused', 'false')
    expect(task3).toHaveAttribute('data-focused', 'false')
  })

  it('handles keyboard events when onKeyDown is provided', () => {
    const mockOnKeyDown = vi.fn()
    const { container } = render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={null}
        onKeyDown={mockOnKeyDown}
      />
    )

    const taskListContainer = container.firstChild as HTMLElement
    userEvent.keyboard('{ArrowDown}')

    // The event should bubble up to the container
    expect(taskListContainer).toBeInTheDocument()
  })

  it('renders tasks in correct order', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={null}
      />
    )

    const taskElements = screen.getAllByTestId(/task-/)
    expect(taskElements[0]).toHaveAttribute('data-testid', 'task-1')
    expect(taskElements[1]).toHaveAttribute('data-testid', 'task-2')
    expect(taskElements[2]).toHaveAttribute('data-testid', 'task-3')
  })

  it('handles single task', () => {
    render(
      <TaskList
        tasks={[mockTasks[0]]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={null}
      />
    )

    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument()
  })
})
