'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();
  
  // Generate breadcrumbs based on the current path
  const generateBreadcrumbs = (): Breadcrumb[] => {
    if (!pathname) return [];
    
    const pathParts = pathname.split('/').filter(part => part !== '');
    const breadcrumbs: Breadcrumb[] = [{ label: 'Home', href: '/' }];
    
    let currentPath = '';
    
    for (const part of pathParts) {
      currentPath += `/${part}`;
      
      // Format the label by capitalizing and replacing hyphens with spaces
      const label = part
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbs.push({ label, href: currentPath });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs if there's only one item (Home)
  }

  return (
    <nav aria-label="breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
            {crumb.href && index < breadcrumbs.length - 1 ? (
              <Link 
                href={crumb.href} 
                className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-900 dark:text-slate-200">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;