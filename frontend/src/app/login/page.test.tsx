import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from './page'

// Mock auth service
vi.mock('../../services/auth_service', () => ({
  login: vi.fn(),
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

describe('Login Page', () => {
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

  it('renders login form with all fields', () => {
    render(<Login />)

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
  })

  it('allows user to type in username/email field', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const input = screen.getByLabelText(/email or username/i)
    await user.type(input, 'testuser@example.com')

    expect(input).toHaveValue('testuser@example.com')
  })

  it('allows user to type in password field', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const input = screen.getByLabelText(/password/i)
    await user.type(input, 'password123')

    expect(input).toHaveValue('password123')
  })

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const passwordInput = screen.getByLabelText(/password/i)
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Find and click the toggle button (it's a button with no accessible name)
    const toggleButton = passwordInput.parentElement?.querySelector('button')
    expect(toggleButton).toBeInTheDocument()

    if (toggleButton) {
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')

      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    }
  })

  it('shows error when submitting with empty fields', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    expect(mockSetError).toHaveBeenCalledWith('Please fill in all fields')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows error when submitting with only username', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const usernameInput = screen.getByLabelText(/email or username/i)
    await user.type(usernameInput, 'testuser')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    expect(mockSetError).toHaveBeenCalledWith('Please fill in all fields')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows error when submitting with only password', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const passwordInput = screen.getByLabelText(/password/i)
    await user.type(passwordInput, 'password123')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    expect(mockSetError).toHaveBeenCalledWith('Please fill in all fields')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('successfully logs in and redirects to tasks page', async () => {
    const user = userEvent.setup()
    const { login } = await import('../../services/auth_service')
    vi.mocked(login).mockResolvedValue({ access_token: 'fake-token', token_type: 'bearer' })

    render(<Login />)

    const usernameInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(usernameInput, 'testuser@example.com')
    await user.type(passwordInput, 'password123')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('testuser@example.com', 'password123')
      expect(mockPush).toHaveBeenCalledWith('/tasks')
    })
  })

  it('shows error message when login fails with string detail', async () => {
    const user = userEvent.setup()
    const { login } = await import('../../services/auth_service')
    vi.mocked(login).mockRejectedValue({
      response: {
        data: {
          detail: 'Invalid credentials',
        },
      },
    })

    render(<Login />)

    const usernameInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(usernameInput, 'testuser@example.com')
    await user.type(passwordInput, 'wrongpassword')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Invalid credentials')
    })
  })

  it('shows error message when login fails with array detail (validation errors)', async () => {
    const user = userEvent.setup()
    const { login } = await import('../../services/auth_service')
    vi.mocked(login).mockRejectedValue({
      response: {
        data: {
          detail: [
            { loc: ['body', 'username'], msg: 'field required' },
            { loc: ['body', 'password'], msg: 'field required' },
          ],
        },
      },
    })

    render(<Login />)

    const usernameInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'pass')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('username: field required, password: field required')
    })
  })

  it('shows generic error message when login fails without detail', async () => {
    const user = userEvent.setup()
    const { login } = await import('../../services/auth_service')
    vi.mocked(login).mockRejectedValue({
      message: 'Network error',
    })

    render(<Login />)

    const usernameInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(usernameInput, 'testuser@example.com')
    await user.type(passwordInput, 'password123')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Network error')
    })
  })

  it('displays error message in the UI when error is set', () => {
    vi.mocked(require('../../providers/ErrorProvider').useError).mockReturnValue({
      error: 'Invalid credentials',
      setError: mockSetError,
    })

    render(<Login />)

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('has a link to signup page', () => {
    render(<Login />)

    const signupLink = screen.getByRole('link', { name: /create one/i })
    expect(signupLink).toHaveAttribute('href', '/signup')
  })

  it('clears error on component mount', () => {
    render(<Login />)

    expect(mockSetError).toHaveBeenCalledWith(null)
  })
})
