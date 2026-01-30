"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '../../services/auth_service';
import { useError } from '../../providers/ErrorProvider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';

interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

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

      // Cookie is automatically set by backend, no need to store token
      // Just redirect to tasks page
      router.push('/tasks');
    } catch (err: any) {

      // Handle different error response formats
      let errorMessage = 'Failed to log in';

      if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;

        // Check if detail is an array (Pydantic validation errors)
        if (Array.isArray(detail)) {
          // Extract and format validation error messages
          errorMessage = detail.map((error: any) => {
            const field = error.loc?.[error.loc.length - 1] || 'field';
            return `${field}: ${error.msg}`;
          }).join(', ');
        } else if (typeof detail === 'string') {
          // Simple string error message
          errorMessage = detail;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 relative py-8 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="card-hover">
          <div className="mb-8">
            <h1 className="heading-2 gradient-text mb-2">Welcome Back</h1>
            <p className="text-muted">Sign in to continue managing your tasks</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail" className="text-sm font-medium">
                Email or Username
              </Label>
              <Input
                id="usernameOrEmail"
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full btn-primary">
              Sign In
            </Button>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-center text-sm text-muted">
                Don't have an account?{' '}
                <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold">
                  Create one
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
