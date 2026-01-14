'use client';

// Task T019: Chat page for Phase III AI Chatbot
// Main page component for AI chat interface

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/src/components/ChatInterface';
import { Loader2 } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for authentication token
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }

    setToken(storedToken);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen">
      <ChatInterface token={token} />
    </div>
  );
}
