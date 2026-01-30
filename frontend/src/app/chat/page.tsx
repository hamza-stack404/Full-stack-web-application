'use client';

// Task T019: Chat page for Phase III AI Chatbot
// Main page component for AI chat interface

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/src/components/ChatInterface';
import { Loader2 } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Authentication is handled by cookies
    // We'll let the ChatInterface component handle auth errors
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen">
      <ChatInterface />
    </div>
  );
}
