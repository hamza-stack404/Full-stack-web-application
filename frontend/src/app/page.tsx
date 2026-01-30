"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to tasks page by default
    // If user is not authenticated (no cookies), tasks page will redirect to login
    router.push('/tasks');
  }, [router]);

  return null;
}
