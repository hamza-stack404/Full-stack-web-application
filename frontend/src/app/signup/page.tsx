"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signup } from '../../services/auth_service';
import { useError } from '../../providers/ErrorProvider';
// Import Shadcn UI components
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// Import the EyeIcon for the show/hide password functionality
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../../components/ThemeToggle';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { error, setError } = useError();
  const router = useRouter();

  useEffect(() => {
    setError(null);
  }, [setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!username || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    // Validate password length (bcrypt has 72-byte limit)
    const passwordBytes = new TextEncoder().encode(password).length;
    if (passwordBytes > 72) {
      setError(`Password is too long (${passwordBytes} bytes). Maximum is 72 bytes.`);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      await signup(username, email, password);
      router.push('/login');
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to sign up';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="bg-card shadow-lg rounded-lg flex max-w-4xl w-full">
        {/* Left side with gradient */}
        <div className="w-1/2 bg-gradient-to-br from-primary to-primary-foreground p-8 rounded-l-lg text-primary-foreground flex flex-col justify-center">
          <h1 className="text-4xl font-bold mb-4">Create Your Account</h1>
          <p className="text-lg">Get started with the best task manager.</p>
        </div>

        {/* Right side with the form */}
        <div className="w-1/2 p-8">
          <h2 className="text-3xl font-bold mb-6">Sign Up</h2>

          <form onSubmit={handleSubmit}>
            {error && <p className="mb-4 text-destructive bg-destructive/20 p-3 rounded">{error}</p>}

            <div className="mb-4">
              <Label htmlFor="username">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourusername"
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="mb-4 relative">
              <Label htmlFor="password">
                Password {password && `(${new TextEncoder().encode(password).length}/72 bytes)`}
              </Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                maxLength={100}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </Button>
            </div>

            <div className="mb-6 relative">
              <Label htmlFor="confirmPassword">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full">
              Sign Up
            </Button>

            <p className="mt-6 text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:text-primary/90 font-bold">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
