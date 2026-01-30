import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddTaskForm from './AddTaskForm'

// Mock framer-motion (requires JSX, must be in .tsx file)
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}))

describe('AddTaskForm', () => {
  const mockOnAdd = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form with all fields', () => {
    render(<AddTaskForm onAdd={mockOnAdd} />)

    expect(screen.getByPlaceholderText('Add a new task...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
  })

  it('allows user to type in the task input', async () => {
    const user = userEvent.setup()
    render(<AddTaskForm onAdd={mockOnAdd} />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.type(input, 'Buy groceries')

    expect(input).toHaveValue('Buy groceries')
  })

  it('submits the form with task title', async () => {
    const user = userEvent.setup()
    mockOnAdd.mockResolvedValue(undefined)
    render(<AddTaskForm onAdd={mockOnAdd} />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.type(input, 'Buy groceries')

    const submitButton = screen.getByRole('button', { name: /add/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Buy groceries',
          is_completed: false,
          priority: 'medium',
        })
      )
    })
  })

  it('does not submit when title is empty', async () => {
    const user = userEvent.setup()
    render(<AddTaskForm onAdd={mockOnAdd} />)

    const submitButton = screen.getByRole('button', { name: /add/i })
    await user.click(submitButton)

    expect(mockOnAdd).not.toHaveBeenCalled()
  })

  it('does not submit when title is only whitespace', async () => {
    const user = userEvent.setup()
    render(<AddTaskForm onAdd={mockOnAdd} />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.type(input, '   ')

    const submitButton = screen.getByRole('button', { name: /add/i })
    await user.click(submitButton)

    expect(mockOnAdd).not.toHaveBeenCalled()
  })

  it('clears the input after successful submission', async () => {
    const user = userEvent.setup()
    mockOnAdd.mockResolvedValue(undefined)
    render(<AddTaskForm onAdd={mockOnAdd} />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.type(input, 'Buy groceries')

    const submitButton = screen.getByRole('button', { name: /add/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('submits with default priority as medium', async () => {
    const user = userEvent.setup()
    mockOnAdd.mockResolvedValue(undefined)
    render(<AddTaskForm onAdd={mockOnAdd} />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.type(input, 'Test task')

    const submitButton = screen.getByRole('button', { name: /add/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'medium',
        })
      )
    })
  })

  it('handles form submission with Enter key', async () => {
    const user = userEvent.setup()
    mockOnAdd.mockResolvedValue(undefined)
    render(<AddTaskForm onAdd={mockOnAdd} />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.type(input, 'Test task{Enter}')

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test task',
        })
      )
    })
  })

  it('shows error toast when submission fails', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')
    mockOnAdd.mockRejectedValue(new Error('API Error'))
    render(<AddTaskForm onAdd={mockOnAdd} />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.type(input, 'Test task')

    const submitButton = screen.getByRole('button', { name: /add/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to add task.')
    })
  })

  it('shows success toast when submission succeeds', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')
    mockOnAdd.mockResolvedValue(undefined)
    render(<AddTaskForm onAdd={mockOnAdd} />)

    const input = screen.getByPlaceholderText('Add a new task...')
    await user.type(input, 'Test task')

    const submitButton = screen.getByRole('button', { name: /add/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Task added successfully!')
    })
  })
})
