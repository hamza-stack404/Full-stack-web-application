"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '../../services/auth_service';
import { useError } from '../../providers/ErrorProvider';
// Import Shadcn UI components
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// Import the EyeIcon for the show/hide password functionality
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../../components/ThemeToggle';

export default function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { error, setError } = useError();
  const router = useRouter();

  useEffect(() => {
    setError(null);
  }, [setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setError("Please fill in all fields");
      return;
    }
    try {
      const response = await login(usernameOrEmail, password);
      console.log('Login response:', response);
      
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        console.log('Token saved:', response.access_token);
        router.push('/tasks');
      } else {
        setError('No token received from server');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to log in';
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
          <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
          <p className="text-lg">Log in to continue to your tasks.</p>
        </div>

        {/* Right side with the form */}
        <div className="w-1/2 p-8">
          <h2 className="text-3xl font-bold mb-6">Login</h2>

          <form onSubmit={handleSubmit}>
            {error && <p className="mb-4 text-destructive bg-destructive/20 p-3 rounded">{error}</p>}

            <div className="mb-6">
              <Label htmlFor="usernameOrEmail">
                Email or Username
              </Label>
              <Input
                id="usernameOrEmail"
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="mb-6 relative">
              <Label htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost" // Use ghost variant for subtle styling
                size="sm" // Smaller size
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2" // Adjust positioning
              >
                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </Button>
            </div>

            <Button type="submit" className="w-full"> {/* Shadcn Button handles styling */}
              Login
            </Button>

            <p className="mt-6 text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:text-primary/90 font-bold">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
