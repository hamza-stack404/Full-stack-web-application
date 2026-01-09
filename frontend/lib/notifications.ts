import { Task } from "@/src/services/task_service";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";


export const requestNotificationPermission = () => {
  // Placeholder for requesting notification permission
  console.log("Requesting notification permission (placeholder)");
  return Promise.resolve("default"); // or "granted", "denied"
};

export const checkUpcomingTasks = (tasks: Task[]) => {
  // Placeholder for checking upcoming tasks and triggering notifications
  console.log("Checking upcoming tasks (placeholder)", tasks);
  // This function would typically interact with task data and potentially
  // trigger browser notifications.
};

export const showTaskCreatedNotification = (task: Task) => {
  toast.success("Task Created", {
    description: `Task "${task.title}" has been successfully created.`,
  });
};

export const showTaskCompletedNotification = (task: Task) => {
  toast.info("Task Completed", {
    description: `Task "${task.title}" has been marked as completed.`,
  });
};
