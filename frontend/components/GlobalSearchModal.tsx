'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, FileText, Settings, User, Home, ListTodo } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { Input } from './ui/input';

interface SearchItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const GlobalSearchModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample search data - in a real app, this would come from an API
  const searchItems: SearchItem[] = [
    { id: '1', title: 'Dashboard', description: 'View your dashboard', icon: <Home className="h-4 w-4" />, href: '/dashboard' },
    { id: '2', title: 'All Tasks', description: 'View all your tasks', icon: <ListTodo className="h-4 w-4" />, href: '/tasks' },
    { id: '3', title: 'Completed Tasks', description: 'View completed tasks', icon: <ListTodo className="h-4 w-4" />, href: '/tasks?completed=true' },
    { id: '4', title: 'Profile Settings', description: 'Manage your profile', icon: <Settings className="h-4 w-4" />, href: '/profile/settings' },
    { id: '5', title: 'Account Info', description: 'View account details', icon: <User className="h-4 w-4" />, href: '/profile/account' },
    { id: '6', title: 'Documentation', description: 'App documentation', icon: <FileText className="h-4 w-4" />, href: '/docs' },
  ];

  // Filter items based on search query
  const filteredItems = searchQuery
    ? searchItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchItems;

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check for Cmd+K or Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(true);
    }
    
    // Check for Escape key
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        aria-label="Open search"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto hidden md:block px-2 py-0.5 text-xs rounded bg-slate-200 dark:bg-slate-700">⌘K</kbd>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="top-1/4 sm:top-1/4 max-w-2xl p-0 overflow-hidden">
          <div className="relative">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center">
              <Search className="h-5 w-5 absolute ml-4 text-slate-500 dark:text-slate-400" />
              <Input
                autoFocus
                placeholder="Search for tasks, pages, settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {filteredItems.length > 0 ? (
                <ul>
                  {filteredItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        className="flex items-center gap-3 p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
              <div>↑↓ Navigate</div>
              <div>⏎ Select</div>
              <div>ESC Close</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalSearchModal;