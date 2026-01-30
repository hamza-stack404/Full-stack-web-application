import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Signup from './page'

// Mock auth service
vi.mock('../../services/auth_service', () => ({
  signup: vi.fn(),
}))

// Mock ErrorProvider
vi.mock('../../providers/ErrorProvider', () => ({
  useError: () => ({
    error: null,
    setError: vi.fn(),
  }),
}))

// Mock ThemeToggle component
vi.mock('../../components/ThemeToggle', () => ({
  default: () => <div>ThemeToggle</div>,
}))

describe('Signup Page', () => {
  const mockPush = vi.fn()
  const mockSetError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset router mock
    vi.mocked(require('next/navigation').useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
    })
    // Reset error provider mock
    vi.mocked(require('../../providers/ErrorProvider').useError).mockReturnValue({
      error: null,
      setError: mockSetError,
    })
  })

  it('renders signup form with all fields', () => {
    render(<Signup />)

    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('allows user to type in all fields', async () => {
    const user = userEvent.setup()
    render(<Signup />)

    const usernameInput = screen.getByLabelText(/username/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'Password123!')

    expect(usernameInput).toHaveValue('testuser')
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('Password123!')
    expect(confirmPasswordInput).toHaveValue('Password123!')
  })

  it('toggles password visibility for both password fields', async () => {
    const user = userEvent.setup()
    render(<Signup />)

    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')

    // Find toggle button
    const toggleButtons = screen.getAllByRole('button', { name: '' })
    const toggleButton = toggleButtons[0] // First toggle button

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(confirmPasswordInput).toHaveAttribute('type', 'text')

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')
  })

  it('shows error when submitting with empty fields', async () => {
    const user = userEvent.setup()
    render(<Signup />)

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    expect(mockSetError).toHaveBeenCalledWith('Please fill in all fields')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<Signup />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'Password123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPassword123!')

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    expect(mockSetError).toHaveBeenCalledWith("Passwords don't match")
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows error when password exceeds 72 bytes', async () => {
    const user = userEvent.setup()
    render(<Signup />)

    // Create a password that exceeds 72 bytes
    const longPassword = 'a'.repeat(73)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), longPassword)
    await user.type(screen.getByLabelText(/confirm password/i), longPassword)

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    expect(mockSetError).toHaveBeenCalledWith(expect.stringContaining('Password is too long'))
    expect(mockSetError).toHaveBeenCalledWith(expect.stringContaining('Maximum is 72 bytes'))
  })

  it('successfully signs up and redirects to login page', async () => {
    const user = userEvent.setup()
    const { signup } = await import('../../services/auth_service')
    vi.mocked(signup).mockResolvedValue({ id: 1, username: 'testuser', email: 'test@example.com' })

    render(<Signup />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'Password123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!')

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(signup).toHaveBeenCalledWith('testuser', 'test@example.com', 'Password123!')
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('shows error message when signup fails with string detail', async () => {
    const user = userEvent.setup()
    const { signup } = await import('../../services/auth_service')
    vi.mocked(signup).mockRejectedValue({
      response: {
        data: {
          detail: 'Email already registered',
        },
      },
    })

    render(<Signup />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/email address/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'Password123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!')

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Email already registered')
    })
  })

  it('shows error message when signup fails with array detail (validation errors)', async () => {
    const user = userEvent.setup()
    const { signup } = await import('../../services/auth_service')
    vi.mocked(signup).mockRejectedValue({
      response: {
        data: {
          detail: [
            { loc: ['body', 'email'], msg: 'invalid email format' },
            { loc: ['body', 'password'], msg: 'password too short' },
          ],
        },
      },
    })

    render(<Signup />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/email address/i), 'invalid-email')
    await user.type(screen.getByLabelText(/^password/i), 'short')
    await user.type(screen.getByLabelText(/confirm password/i), 'short')

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('email: invalid email format, password: password too short')
    })
  })

  it('shows generic error message when signup fails without detail', async () => {
    const user = userEvent.setup()
    const { signup } = await import('../../services/auth_service')
    vi.mocked(signup).mockRejectedValue({
      message: 'Network error',
    })

    render(<Signup />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'Password123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!')

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Network error')
    })
  })

  it('displays error message in the UI when error is set', () => {
    vi.mocked(require('../../providers/ErrorProvider').useError).mockReturnValue({
      error: 'Username already taken',
      setError: mockSetError,
    })

    render(<Signup />)

    expect(screen.getByText('Username already taken')).toBeInTheDocument()
  })

  it('has a link to login page', () => {
    render(<Signup />)

    const loginLink = screen.getByRole('link', { name: /sign in/i })
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('clears error on component mount', () => {
    render(<Signup />)

    expect(mockSetError).toHaveBeenCalledWith(null)
  })

  it('displays password byte count when typing', async () => {
    const user = userEvent.setup()
    render(<Signup />)

    const passwordInput = screen.getByLabelText(/^password/i)
    await user.type(passwordInput, 'Test123!')

    // Check if byte count is displayed (8 characters = 8 bytes for ASCII)
    expect(screen.getByText(/\(8\/72\)/)).toBeInTheDocument()
  })
})
