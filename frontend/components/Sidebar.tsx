'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, ListTodo, User, Settings, ChevronDown, ChevronRight, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  items?: NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tasks: true,
    profile: false,
  });

  const navItems: NavItem[] = [
    {
      title: 'Home',
      href: '/tasks',
      icon: <Home className="h-4 w-4" />,
    },
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      title: 'Tasks',
      href: '#',
      icon: <ListTodo className="h-4 w-4" />,
      items: [
        {
          title: 'All Tasks',
          href: '/tasks',
          icon: <ListTodo className="h-4 w-4" />,
        },
        {
          title: 'Completed',
          href: '/tasks?completed=true',
          icon: <ListTodo className="h-4 w-4" />,
        },
        {
          title: 'Pending',
          href: '/tasks?completed=false',
          icon: <ListTodo className="h-4 w-4" />,
        },
      ],
    },
    {
      title: 'Profile',
      href: '#',
      icon: <User className="h-4 w-4" />,
      items: [
        {
          title: 'Settings',
          href: '/profile/settings',
          icon: <Settings className="h-4 w-4" />,
        },
        {
          title: 'Account',
          href: '/profile/account',
          icon: <User className="h-4 w-4" />,
        },
      ],
    },
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (href: string) => {
    if (href === '#') return false;
    return pathname === href || pathname.startsWith(href + '?');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Todo App</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li key={index}>
                {item.items ? (
                  <div>
                    <Button
                      variant="ghost"
                      className={`w-full justify-between ${isActive(item.href) ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                      onClick={() => toggleSection(`${item.title.toLowerCase()}-${index}`)}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                      {expandedSections[`${item.title.toLowerCase()}-${index}`] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    {expandedSections[`${item.title.toLowerCase()}-${index}`] && (
                      <ul className="ml-8 mt-1 space-y-1 pl-2 border-l border-slate-200 dark:border-slate-700">
                        {item.items.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <Link 
                              href={subItem.href}
                              className={`flex items-center gap-3 p-2 rounded-md ${
                                isActive(subItem.href) 
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' 
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {subItem.icon}
                              <span>{subItem.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 p-2 rounded-md ${
                      isActive(item.href)
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;