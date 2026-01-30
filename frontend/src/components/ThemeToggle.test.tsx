import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeToggle from './ThemeToggle'

// Mock ThemeProvider
const mockToggleTheme = vi.fn()
vi.mock('../providers/ThemeProvider', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: mockToggleTheme,
  }),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders theme toggle button', () => {
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /switch to dark mode/i })
    expect(button).toBeInTheDocument()
  })

  it('calls toggleTheme when clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(mockToggleTheme).toHaveBeenCalledTimes(1)
  })

  it('shows correct aria-label for light theme', () => {
    vi.mocked(require('../providers/ThemeProvider').useTheme).mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
    })

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
  })

  it('shows correct aria-label for dark theme', () => {
    vi.mocked(require('../providers/ThemeProvider').useTheme).mockReturnValue({
      theme: 'dark',
      toggleTheme: mockToggleTheme,
    })

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
  })

  it('has correct title attribute for light theme', () => {
    vi.mocked(require('../providers/ThemeProvider').useTheme).mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
    })

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Switch to dark mode')
  })

  it('has correct title attribute for dark theme', () => {
    vi.mocked(require('../providers/ThemeProvider').useTheme).mockReturnValue({
      theme: 'dark',
      toggleTheme: mockToggleTheme,
    })

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Switch to light mode')
  })
})
