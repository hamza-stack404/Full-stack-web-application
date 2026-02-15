"use client";

import { useEffect } from 'react';
import { requestNotificationPermission } from '@/lib/websocket';

/**
 * NotificationPermissionHandler - Phase V
 *
 * Requests browser notification permission on app load.
 * This component is mounted in the root layout to ensure
 * permissions are requested early in the user session.
 */
export default function NotificationPermissionHandler() {
  useEffect(() => {
    // Request notification permission when app loads
    const requestPermission = async () => {
      try {
        const permission = await requestNotificationPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted');
        } else if (permission === 'denied') {
          console.warn('Notification permission denied');
        }
      } catch (error) {
        console.error('Failed to request notification permission:', error);
      }
    };

    requestPermission();
  }, []);

  // This component doesn't render anything
  return null;
}
