import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskList from './TaskList'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock drag and drop library
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <div>{children}</div>,
  Droppable: ({ children }: any) => children({
    droppableProps: {},
    innerRef: vi.fn(),
    placeholder: null,
  }),
  Draggable: ({ children, draggableId, index }: any) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: vi.fn(),
  }, { isDragging: false }),
}))

// Mock Task component
vi.mock('./Task', () => ({
  default: ({ task, onUpdate, onDelete, isSelected, onToggleSelection }: any) => (
    <div data-testid={`task-${task.id}`}>
      <span>{task.title}</span>
      <input
        type="checkbox"
        checked={task.is_completed}
        onChange={() => onUpdate(task.id, { ...task, is_completed: !task.is_completed })}
        aria-label={`Toggle ${task.title}`}
      />
      <button onClick={() => onDelete(task.id)} aria-label={`Delete ${task.title}`}>
        Delete
      </button>
      {onToggleSelection && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(task.id)}
          aria-label={`Select ${task.title}`}
        />
      )}
    </div>
  ),
}))

describe('TaskList', () => {
  const mockTasks = [
    {
      id: 1,
      title: 'Task 1',
      is_completed: false,
      priority: 'high',
      category: 'Work',
      tags: ['urgent'],
      subtasks: [],
    },
    {
      id: 2,
      title: 'Task 2',
      is_completed: true,
      priority: 'medium',
      category: 'Personal',
      tags: [],
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
  const mockOnKeyDown = vi.fn()
  const mockOnToggleSelection = vi.fn()

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

    const checkbox = screen.getByLabelText('Toggle Task 1')
    await user.click(checkbox)

    expect(mockOnUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
      id: 1,
      title: 'Task 1',
      is_completed: true,
    }))
  })

  it('calls onDelete when delete button is clicked', async () => {
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

    const deleteButton = screen.getByLabelText('Delete Task 1')
    await user.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith(1)
  })

  it('applies focus styling to focused task', () => {
    const { container } = render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={1}
      />
    )

    // Check if the second task (index 1) has focus styling
    const focusedElement = container.querySelector('.ring-2.ring-blue-500')
    expect(focusedElement).toBeInTheDocument()
  })

  it('calls onKeyDown when keyboard event occurs', () => {
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
    fireEvent.keyDown(taskListContainer, { key: 'ArrowDown' })

    expect(mockOnKeyDown).toHaveBeenCalled()
  })

  it('renders selection checkboxes in selection mode', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={null}
        selectionMode={true}
        selectedTaskIds={new Set([1])}
        onToggleSelection={mockOnToggleSelection}
      />
    )

    expect(screen.getByLabelText('Select Task 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Select Task 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Select Task 3')).toBeInTheDocument()
  })

  it('calls onToggleSelection when selection checkbox is clicked', async () => {
    const user = userEvent.setup()
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={null}
        selectionMode={true}
        selectedTaskIds={new Set()}
        onToggleSelection={mockOnToggleSelection}
      />
    )

    const selectionCheckbox = screen.getByLabelText('Select Task 1')
    await user.click(selectionCheckbox)

    expect(mockOnToggleSelection).toHaveBeenCalledWith(1)
  })

  it('shows selected state for selected tasks', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={null}
        selectionMode={true}
        selectedTaskIds={new Set([1, 3])}
        onToggleSelection={mockOnToggleSelection}
      />
    )

    const task1Checkbox = screen.getByLabelText('Select Task 1')
    const task2Checkbox = screen.getByLabelText('Select Task 2')
    const task3Checkbox = screen.getByLabelText('Select Task 3')

    expect(task1Checkbox).toBeChecked()
    expect(task2Checkbox).not.toBeChecked()
    expect(task3Checkbox).toBeChecked()
  })

  it('renders tasks with different priorities', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={null}
      />
    )

    // All tasks should be rendered regardless of priority
    expect(screen.getByTestId('task-1')).toBeInTheDocument()
    expect(screen.getByTestId('task-2')).toBeInTheDocument()
    expect(screen.getByTestId('task-3')).toBeInTheDocument()
  })

  it('handles tasks with and without optional fields', () => {
    const tasksWithOptionalFields = [
      {
        id: 1,
        title: 'Task with all fields',
        is_completed: false,
        priority: 'high',
        category: 'Work',
        tags: ['urgent', 'important'],
        due_date: '2026-01-30',
        subtasks: [{ id: 1, title: 'Subtask 1', is_completed: false }],
      },
      {
        id: 2,
        title: 'Task with minimal fields',
        is_completed: false,
        priority: 'medium',
        subtasks: [],
      },
    ]

    render(
      <TaskList
        tasks={tasksWithOptionalFields}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
        focusedIndex={null}
      />
    )

    expect(screen.getByText('Task with all fields')).toBeInTheDocument()
    expect(screen.getByText('Task with minimal fields')).toBeInTheDocument()
  })
})
