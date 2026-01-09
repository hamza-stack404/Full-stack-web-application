"use client";

import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Task {
  id: number;
  title: string;
  is_completed: boolean;
  priority: string;
  category?: string;
  due_date?: string;
  subtasks?: any[];
}

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];

  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      // Get tasks for this day
      const dayTasks = tasks.filter(task => 
        task.due_date && 
        isSameDay(new Date(task.due_date), cloneDay) 
      );

      days.push(
        <div
          className={`border border-slate-200 dark:border-slate-700 min-h-24 p-1 ${
            !isSameMonth(cloneDay, monthStart) ? "bg-slate-100 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600" : ""
          }`}
          key={cloneDay.toString()}
        >
          <div className="flex justify-between items-center">
            <span className={`text-sm p-1 ${isSameDay(cloneDay, new Date()) ? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center" : ""}`}>
              {formattedDate}
            </span>
          </div>
          <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
            {dayTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={`text-xs p-1 rounded truncate cursor-pointer ${
                  task.is_completed 
                    ? "bg-green-100 dark:bg-green-900/30 line-through text-green-600 dark:text-green-400" 
                    : `bg-${
                        task.priority === 'high' ? 'red' :
                        task.priority === 'medium' ? 'yellow' :
                        task.priority === 'low' ? 'green' : 'blue'
                      }-100 dark:bg-${
                        task.priority === 'high' ? 'red' :
                        task.priority === 'medium' ? 'yellow' :
                        task.priority === 'low' ? 'green' : 'blue'
                      }-900/30 ${
                        task.priority === 'high' ? 'text-red-700 dark:text-red-300' :
                        task.priority === 'medium' ? 'text-yellow-700 dark:text-yellow-300' :
                        task.priority === 'low' ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'
                      }`
                }`}
                title={task.title}
              >
                {task.title}
              </div>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 gap-0" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="calendar-view bg-white dark:bg-slate-900 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0 text-center mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            {day}
          </div>
        ))}
      </div>
      <div className="space-y-1">{rows}</div>
    </div>
  );
}