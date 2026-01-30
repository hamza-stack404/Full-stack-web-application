"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/src/services/auth_service';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/src/components/ThemeToggle';
import { LogOut, Menu, Bell, Palette, Clock, Keyboard, Database, Zap, Globe, Layout } from 'lucide-react';
import { Tooltip } from '@/src/components/ui/tooltip';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import DashboardCustomizer from '@/src/components/DashboardCustomizer';

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // Appearance Settings
  const [compactView, setCompactView] = useState(false);
  const [showAnimations, setShowAnimations] = useState(true);
  const [fontSize, setFontSize] = useState('medium');

  // Task Default Settings
  const [defaultPriority, setDefaultPriority] = useState('medium');
  const [defaultCategory, setDefaultCategory] = useState('none');
  const [autoArchive, setAutoArchive] = useState(false);
  const [defaultSortBy, setDefaultSortBy] = useState('none');

  // Display Preferences
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState('sunday');
  const [language, setLanguage] = useState('en');

  // Notification Settings
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationTiming, setNotificationTiming] = useState('immediate');

  // Productivity Settings
  const [pomodoroWorkDuration, setPomodoroWorkDuration] = useState('25');
  const [pomodoroBreakDuration, setPomodoroBreakDuration] = useState('5');
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);

  // Advanced Settings
  const [developerMode, setDeveloperMode] = useState(false);
  const [betaFeatures, setBetaFeatures] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    // Load settings from localStorage
    loadSettings();
  }, []);

  const loadSettings = () => {
    // Appearance
    setCompactView(localStorage.getItem('compactView') === 'true');
    setShowAnimations(localStorage.getItem('showAnimations') !== 'false');
    setFontSize(localStorage.getItem('fontSize') || 'medium');

    // Task Defaults
    setDefaultPriority(localStorage.getItem('defaultPriority') || 'medium');
    setDefaultCategory(localStorage.getItem('defaultCategory') || 'none');
    setAutoArchive(localStorage.getItem('autoArchive') === 'true');
    setDefaultSortBy(localStorage.getItem('defaultSortBy') || 'none');

    // Display
    setDateFormat(localStorage.getItem('dateFormat') || 'MM/DD/YYYY');
    setTimeFormat(localStorage.getItem('timeFormat') || '12h');
    setFirstDayOfWeek(localStorage.getItem('firstDayOfWeek') || 'sunday');
    setLanguage(localStorage.getItem('language') || 'en');

    // Notifications
    setBrowserNotifications(localStorage.getItem('browserNotifications') !== 'false');
    setSoundEnabled(localStorage.getItem('soundEnabled') !== 'false');
    setNotificationTiming(localStorage.getItem('notificationTiming') || 'immediate');

    // Productivity
    setPomodoroWorkDuration(localStorage.getItem('pomodoroWorkDuration') || '25');
    setPomodoroBreakDuration(localStorage.getItem('pomodoroBreakDuration') || '5');
    setAutoStartBreaks(localStorage.getItem('autoStartBreaks') === 'true');
    setFocusModeEnabled(localStorage.getItem('focusModeEnabled') === 'true');

    // Advanced
    setDeveloperMode(localStorage.getItem('developerMode') === 'true');
    setBetaFeatures(localStorage.getItem('betaFeatures') === 'true');
    setAnalyticsEnabled(localStorage.getItem('analyticsEnabled') !== 'false');
  };

  const handleSettingChange = (key: string, value: any) => {
    localStorage.setItem(key, value.toString());
    toast.success('Setting updated successfully');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const keyboardShortcuts = [
    { keys: 'Ctrl + N', description: 'Create new task' },
    { keys: 'Ctrl + K', description: 'Open search' },
    { keys: 'Esc', description: 'Close modal/Clear selection' },
    { keys: 'Delete', description: 'Delete selected task' },
    { keys: 'Space', description: 'Toggle task completion' },
    { keys: 'Enter', description: 'Open task details' },
    { keys: '↑ / ↓', description: 'Navigate tasks' },
    { keys: 'Ctrl + /', description: 'Show keyboard shortcuts' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className={sidebarOpen ? "md:ml-64" : ""}>
        <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="heading-2 gradient-text">Settings</h1>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Tooltip text="Toggle theme">
                <ThemeToggle />
              </Tooltip>
              <button
                onClick={handleLogout}
                className="btn-outline flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4 sm:p-6 space-y-6 pb-16">
          <Breadcrumbs />

          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="productivity" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Productivity
              </TabsTrigger>
            </TabsList>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance Settings</CardTitle>
                    <CardDescription>Customize how your app looks and feels</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="compactView">Compact View</Label>
                        <p className="text-sm text-muted-foreground">Use a more condensed layout</p>
                      </div>
                      <Switch
                        id="compactView"
                        checked={compactView}
                        onCheckedChange={(checked) => {
                          setCompactView(checked);
                          handleSettingChange('compactView', checked);
                        }}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showAnimations">Show Animations</Label>
                        <p className="text-sm text-muted-foreground">Enable smooth transitions and animations</p>
                      </div>
                      <Switch
                        id="showAnimations"
                        checked={showAnimations}
                        onCheckedChange={(checked) => {
                          setShowAnimations(checked);
                          handleSettingChange('showAnimations', checked);
                        }}
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="fontSize">Font Size</Label>
                      <Select value={fontSize} onValueChange={(value) => {
                        setFontSize(value);
                        handleSettingChange('fontSize', value);
                      }}>
                        <SelectTrigger id="fontSize">
                          <SelectValue placeholder="Select font size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Dashboard Customization</CardTitle>
                    <CardDescription>Customize your dashboard layout and widgets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DashboardCustomizer />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Task Default Settings</CardTitle>
                    <CardDescription>Set default values for new tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="defaultPriority">Default Priority</Label>
                      <Select value={defaultPriority} onValueChange={(value) => {
                        setDefaultPriority(value);
                        handleSettingChange('defaultPriority', value);
                      }}>
                        <SelectTrigger id="defaultPriority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="defaultCategory">Default Category</Label>
                      <Select value={defaultCategory} onValueChange={(value) => {
                        setDefaultCategory(value);
                        handleSettingChange('defaultCategory', value);
                      }}>
                        <SelectTrigger id="defaultCategory">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="shopping">Shopping</SelectItem>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="defaultSortBy">Default Sort Order</Label>
                      <Select value={defaultSortBy} onValueChange={(value) => {
                        setDefaultSortBy(value);
                        handleSettingChange('defaultSortBy', value);
                      }}>
                        <SelectTrigger id="defaultSortBy">
                          <SelectValue placeholder="Select sort order" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Sorting</SelectItem>
                          <SelectItem value="due_date_asc">Due Date (Ascending)</SelectItem>
                          <SelectItem value="due_date_desc">Due Date (Descending)</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoArchive">Auto-Archive Completed Tasks</Label>
                        <p className="text-sm text-muted-foreground">Automatically archive tasks after 30 days</p>
                      </div>
                      <Switch
                        id="autoArchive"
                        checked={autoArchive}
                        onCheckedChange={(checked) => {
                          setAutoArchive(checked);
                          handleSettingChange('autoArchive', checked);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Display Preferences</CardTitle>
                    <CardDescription>Customize date, time, and language settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select value={dateFormat} onValueChange={(value) => {
                        setDateFormat(value);
                        handleSettingChange('dateFormat', value);
                      }}>
                        <SelectTrigger id="dateFormat">
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="timeFormat">Time Format</Label>
                      <Select value={timeFormat} onValueChange={(value) => {
                        setTimeFormat(value);
                        handleSettingChange('timeFormat', value);
                      }}>
                        <SelectTrigger id="timeFormat">
                          <SelectValue placeholder="Select time format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                          <SelectItem value="24h">24-hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="firstDayOfWeek">First Day of Week</Label>
                      <Select value={firstDayOfWeek} onValueChange={(value) => {
                        setFirstDayOfWeek(value);
                        handleSettingChange('firstDayOfWeek', value);
                      }}>
                        <SelectTrigger id="firstDayOfWeek">
                          <SelectValue placeholder="Select first day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sunday">Sunday</SelectItem>
                          <SelectItem value="monday">Monday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={language} onValueChange={(value) => {
                        setLanguage(value);
                        handleSettingChange('language', value);
                      }}>
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Manage how you receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="browserNotifications">Browser Notifications</Label>
                        <p className="text-sm text-muted-foreground">Show desktop notifications</p>
                      </div>
                      <Switch
                        id="browserNotifications"
                        checked={browserNotifications}
                        onCheckedChange={(checked) => {
                          setBrowserNotifications(checked);
                          handleSettingChange('browserNotifications', checked);
                        }}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="soundEnabled">Sound Effects</Label>
                        <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
                      </div>
                      <Switch
                        id="soundEnabled"
                        checked={soundEnabled}
                        onCheckedChange={(checked) => {
                          setSoundEnabled(checked);
                          handleSettingChange('soundEnabled', checked);
                        }}
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="notificationTiming">Notification Timing</Label>
                      <Select value={notificationTiming} onValueChange={(value) => {
                        setNotificationTiming(value);
                        handleSettingChange('notificationTiming', value);
                      }}>
                        <SelectTrigger id="notificationTiming">
                          <SelectValue placeholder="Select timing" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="5min">5 minutes before</SelectItem>
                          <SelectItem value="15min">15 minutes before</SelectItem>
                          <SelectItem value="30min">30 minutes before</SelectItem>
                          <SelectItem value="1hour">1 hour before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Productivity Tab */}
            <TabsContent value="productivity" className="space-y-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Pomodoro Timer Settings</CardTitle>
                    <CardDescription>Customize your Pomodoro timer preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="pomodoroWorkDuration">Work Duration (minutes)</Label>
                      <Select value={pomodoroWorkDuration} onValueChange={(value) => {
                        setPomodoroWorkDuration(value);
                        handleSettingChange('pomodoroWorkDuration', value);
                      }}>
                        <SelectTrigger id="pomodoroWorkDuration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="20">20 minutes</SelectItem>
                          <SelectItem value="25">25 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="pomodoroBreakDuration">Break Duration (minutes)</Label>
                      <Select value={pomodoroBreakDuration} onValueChange={(value) => {
                        setPomodoroBreakDuration(value);
                        handleSettingChange('pomodoroBreakDuration', value);
                      }}>
                        <SelectTrigger id="pomodoroBreakDuration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoStartBreaks">Auto-Start Breaks</Label>
                        <p className="text-sm text-muted-foreground">Automatically start break timer</p>
                      </div>
                      <Switch
                        id="autoStartBreaks"
                        checked={autoStartBreaks}
                        onCheckedChange={(checked) => {
                          setAutoStartBreaks(checked);
                          handleSettingChange('autoStartBreaks', checked);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Focus Mode</CardTitle>
                    <CardDescription>Minimize distractions while working</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="focusModeEnabled">Enable Focus Mode</Label>
                        <p className="text-sm text-muted-foreground">Hide completed tasks and reduce visual clutter</p>
                      </div>
                      <Switch
                        id="focusModeEnabled"
                        checked={focusModeEnabled}
                        onCheckedChange={(checked) => {
                          setFocusModeEnabled(checked);
                          handleSettingChange('focusModeEnabled', checked);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Keyboard className="h-5 w-5" />
                      <CardTitle>Keyboard Shortcuts</CardTitle>
                    </div>
                    <CardDescription>Quick actions to boost your productivity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {keyboardShortcuts.map((shortcut, index) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                            {shortcut.keys}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Advanced Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <CardTitle>Advanced Settings</CardTitle>
                </div>
                <CardDescription>Experimental features and developer options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="developerMode">Developer Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable advanced debugging features</p>
                  </div>
                  <Switch
                    id="developerMode"
                    checked={developerMode}
                    onCheckedChange={(checked) => {
                      setDeveloperMode(checked);
                      handleSettingChange('developerMode', checked);
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="betaFeatures">Beta Features</Label>
                    <p className="text-sm text-muted-foreground">Try out experimental features</p>
                  </div>
                  <Switch
                    id="betaFeatures"
                    checked={betaFeatures}
                    onCheckedChange={(checked) => {
                      setBetaFeatures(checked);
                      handleSettingChange('betaFeatures', checked);
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analyticsEnabled">Usage Analytics</Label>
                    <p className="text-sm text-muted-foreground">Help improve the app by sharing anonymous usage data</p>
                  </div>
                  <Switch
                    id="analyticsEnabled"
                    checked={analyticsEnabled}
                    onCheckedChange={(checked) => {
                      setAnalyticsEnabled(checked);
                      handleSettingChange('analyticsEnabled', checked);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
