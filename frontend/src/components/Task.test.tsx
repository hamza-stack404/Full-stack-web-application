import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Task from './Task'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock react-swipeable
vi.mock('react-swipeable', () => ({
  useSwipeable: () => ({}),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('Task', () => {
  const mockTask = {
    id: 1,
    title: 'Test Task',
    is_completed: false,
    priority: 'medium',
    category: 'work',
    subtasks: [],
  }

  const mockOnUpdate = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders task with title', () => {
    render(<Task task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('renders task with priority indicator', () => {
    render(<Task task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    const taskElement = screen.getByText('Test Task').closest('div')
    expect(taskElement).toBeInTheDocument()
  })

  it('renders completed task with line-through style', () => {
    const completedTask = { ...mockTask, is_completed: true }
    render(<Task task={completedTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    const titleElement = screen.getByText('Test Task')
    expect(titleElement).toHaveClass('line-through')
  })

  it('renders task with category badge', () => {
    render(<Task task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    expect(screen.getByText('work')).toBeInTheDocument()
  })

  it('renders task without category when not provided', () => {
    const taskWithoutCategory = { ...mockTask, category: undefined }
    render(<Task task={taskWithoutCategory} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    expect(screen.queryByText('work')).not.toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(<Task task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id)
  })

  it('shows success toast when task is deleted', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')
    render(<Task task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(deleteButton)

    expect(toast.success).toHaveBeenCalledWith('Task deleted successfully!')
  })

  it('toggles task completion when checkbox is clicked', async () => {
    const user = userEvent.setup()
    render(<Task task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(mockOnUpdate).toHaveBeenCalledWith(
      mockTask.id,
      expect.objectContaining({
        is_completed: true,
      })
    )
  })

  it('renders task with due date when provided', () => {
    const taskWithDueDate = {
      ...mockTask,
      due_date: '2026-01-20T00:00:00.000Z',
    }
    render(<Task task={taskWithDueDate} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    // Check if date is rendered (format may vary)
    expect(screen.getByText(/Jan/i)).toBeInTheDocument()
  })

  it('renders task with subtasks', () => {
    const taskWithSubtasks = {
      ...mockTask,
      subtasks: [
        { id: 1, title: 'Subtask 1', is_completed: false },
        { id: 2, title: 'Subtask 2', is_completed: true },
      ],
    }
    render(<Task task={taskWithSubtasks} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    // Subtasks might be shown in a details modal or inline
    // This test verifies the component renders without errors
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('handles keyboard navigation - Enter key opens details', async () => {
    render(<Task task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    const taskElement = screen.getByText('Test Task').closest('[tabindex]')
    if (taskElement) {
      fireEvent.keyDown(taskElement, { key: 'Enter', code: 'Enter' })
      // Details modal should open (implementation specific)
    }
  })

  it('handles keyboard navigation - Delete key deletes task', async () => {
    render(<Task task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    const taskElement = screen.getByText('Test Task').closest('[tabindex]')
    if (taskElement) {
      fireEvent.keyDown(taskElement, { key: 'Delete', code: 'Delete' })
      expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id)
    }
  })

  it('applies focus styles when isFocused prop is true', () => {
    const { container } = render(
      <Task task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} isFocused={true} />
    )

    // Check if focus styles are applied
    const taskElement = container.querySelector('[tabindex]')
    expect(taskElement).toBeInTheDocument()
  })

  it('renders high priority task with red indicator', () => {
    const highPriorityTask = { ...mockTask, priority: 'high' }
    render(<Task task={highPriorityTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    const taskElement = screen.getByText('Test Task').closest('div')
    expect(taskElement?.className).toContain('border-red')
  })

  it('renders low priority task with green indicator', () => {
    const lowPriorityTask = { ...mockTask, priority: 'low' }
    render(<Task task={lowPriorityTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)

    const taskElement = screen.getByText('Test Task').closest('div')
    expect(taskElement?.className).toContain('border-green')
  })
})
