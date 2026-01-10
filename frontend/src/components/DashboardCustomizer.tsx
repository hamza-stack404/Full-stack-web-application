'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LayoutDashboard, 
  Calendar, 
  ListTodo, 
  TrendingUp, 
  Settings,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '@/src/providers/ThemeProvider';

interface DashboardWidget {
  id: string;
  title: string;
  icon: React.ReactNode;
  enabled: boolean;
  position: number;
}

interface DashboardLayout {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  widgets: DashboardWidget[];
}

const defaultWidgets: DashboardWidget[] = [
  { id: 'stats', title: 'Statistics', icon: <TrendingUp className="h-4 w-4" />, enabled: true, position: 0 },
  { id: 'tasks', title: 'Recent Tasks', icon: <ListTodo className="h-4 w-4" />, enabled: true, position: 1 },
  { id: 'calendar', title: 'Calendar', icon: <Calendar className="h-4 w-4" />, enabled: true, position: 2 },
  { id: 'productivity', title: 'Productivity Chart', icon: <Monitor className="h-4 w-4" />, enabled: true, position: 3 },
];

const DashboardCustomizer: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [layout, setLayout] = useState<DashboardLayout>({
    theme: 'system',
    compactMode: false,
    widgets: defaultWidgets
  });

  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (savedLayout) {
      try {
        setLayout(JSON.parse(savedLayout));
      } catch (e) {
        console.error('Failed to parse dashboard layout', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboardLayout', JSON.stringify(layout));
  }, [layout]);

  const handleWidgetToggle = (widgetId: string) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget => 
        widget.id === widgetId 
          ? { ...widget, enabled: !widget.enabled } 
          : widget
      ).sort((a, b) => a.position - b.position)
    }));
  };

  const handleCompactModeToggle = () => {
    setLayout(prev => ({
      ...prev,
      compactMode: !prev.compactMode
    }));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setLayout(prev => ({
      ...prev,
      theme: newTheme
    }));
    
    // Apply theme change
    if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', systemPrefersDark);
    } else {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  };

  const enabledWidgets = layout.widgets.filter(w => w.enabled);
  const disabledWidgets = layout.widgets.filter(w => !w.enabled);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dashboard Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Theme</h3>
            <div className="flex gap-4">
              <Button
                variant={layout.theme === 'light' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('light')}
                className="flex items-center gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={layout.theme === 'dark' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('dark')}
                className="flex items-center gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={layout.theme === 'system' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('system')}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                System
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Compact Mode</h3>
              <p className="text-sm text-muted-foreground">Reduce spacing between elements</p>
            </div>
            <Switch
              checked={layout.compactMode}
              onCheckedChange={handleCompactModeToggle}
            />
          </div>

          <div>
            <h3 className="font-medium mb-3">Enabled Widgets</h3>
            <div className="space-y-2">
              {enabledWidgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    {widget.icon}
                    <span>{widget.title}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWidgetToggle(widget.id)}
                  >
                    Hide
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Disabled Widgets</h3>
            <div className="space-y-2">
              {disabledWidgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    {widget.icon}
                    <span>{widget.title}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWidgetToggle(widget.id)}
                  >
                    Show
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`space-y-4 ${layout.compactMode ? 'space-y-2' : 'space-y-4'}`}>
            {enabledWidgets.map((widget) => (
              <Card key={widget.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {widget.icon}
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This is a preview of the {widget.title.toLowerCase()} widget.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCustomizer;