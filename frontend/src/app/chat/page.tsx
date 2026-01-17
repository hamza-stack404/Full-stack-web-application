// Task T019: Chat page for Phase III AI Chatbot
// Renders ChatInterface with authentication and layout
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/src/components/ChatInterface';
import ThemeToggle from '@/src/components/ThemeToggle';
import { LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function ChatPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for authentication token
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }

    setToken(storedToken);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 h-screen flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
          <div className="flex-1 border rounded-lg">
            <Skeleton className="w-full h-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <Link href="/tasks">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">AI Assistant</h1>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 border rounded-lg overflow-hidden shadow-lg">
          <ChatInterface token={token} />
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            Powered by OpenAI • Phase III AI Chatbot
          </p>
        </div>
      </div>
    </div>
  );
}
