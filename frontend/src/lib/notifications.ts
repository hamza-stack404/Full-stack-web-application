import { Task } from "@/src/services/task_service";
import { formatDistanceToNow, isBefore, addMinutes, isWithinInterval } from "date-fns";
import { toast } from "sonner";

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return "denied";
  }

  const permission = await Notification.requestPermission();
  return permission;
};

export const checkUpcomingTasks = (tasks: Task[]) => {
  const now = new Date();
  const upcomingWindow = addMinutes(now, 15); // Check for tasks due in the next 15 minutes

  tasks.forEach(task => {
    if (task.due_date && task.is_completed === false) {
      const dueDate = new Date(task.due_date);

      // Check if the task is due within the next 15 minutes
      if (isBefore(now, dueDate) && isWithinInterval(dueDate, { start: now, end: upcomingWindow })) {
        // Show toast notification
        toast.info(`Task "${task.title}" is due soon!`, {
          duration: 5000,
          action: {
            label: "View",
            onClick: () => console.log(`Navigating to task ${task.id}`)
          }
        });

        // Show browser notification if permission granted
        if (Notification.permission === "granted") {
          new Notification(`Task Due: ${task.title}`, {
            body: `Your task "${task.title}" is due soon.`,
            icon: "/favicon.ico",
            tag: `task-${task.id}`
          });
        } else if (Notification.permission === "default") {
          // Request permission and then show notification
          requestNotificationPermission().then(permission => {
            if (permission === "granted") {
              new Notification(`Task Due: ${task.title}`, {
                body: `Your task "${task.title}" is due soon.`,
                icon: "/favicon.ico",
                tag: `task-${task.id}`
              });
            }
          });
        }
      }
    }
  });
};

// Function to show overdue task notifications
export const checkOverdueTasks = (tasks: Task[]) => {
  const now = new Date();

  tasks.forEach(task => {
    if (task.due_date && task.is_completed === false) {
      const dueDate = new Date(task.due_date);

      // Check if the task was due before now (overdue)
      if (isBefore(dueDate, now)) {
        toast.warning(`Task "${task.title}" is overdue!`, {
          duration: 7000,
          action: {
            label: "View",
            onClick: () => console.log(`Navigating to task ${task.id}`)
          }
        });

        // Show browser notification for overdue tasks
        if (Notification.permission === "granted") {
          new Notification(`Overdue Task: ${task.title}`, {
            body: `Your task "${task.title}" is overdue.`,
            icon: "/favicon.ico",
            tag: `overdue-task-${task.id}`
          });
        }
      }
    }
  });
};

// Function to show notification when a task is completed
export const showTaskCompletedNotification = (taskTitle: string) => {
  toast.success(`Task "${taskTitle}" completed!`, {
    duration: 3000
  });

  if (Notification.permission === "granted") {
    new Notification("Task Completed!", {
      body: `You've completed the task: "${taskTitle}"`,
      icon: "/favicon.ico"
    });
  }
};

// Function to show notification when a task is created
export const showTaskCreatedNotification = (taskTitle: string) => {
  toast.success(`Task "${taskTitle}" created!`, {
    duration: 3000
  });
};
