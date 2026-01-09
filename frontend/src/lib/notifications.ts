import { Task } from "@/src/services/task_service";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const checkUpcomingTasks = (tasks: Task[]) => {
  const now = new Date();
  tasks.forEach((task) => {
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const timeDifference = dueDate.getTime() - now.getTime();
      const minutesToDue = timeDifference / (1000 * 60);

      if (minutesToDue > 0 && minutesToDue <= 60) {
        showNotification(
          `Task due soon: ${task.title}`,
          `Due in ${formatDistanceToNow(dueDate, { addSuffix: true })}`
        );
      }
    }
  });
};

export const checkOverdueTasks = (tasks: Task[]) => {
  const now = new Date();
  tasks.forEach((task) => {
    if (task.due_date && !task.is_completed) {
      const dueDate = new Date(task.due_date);
      if (dueDate < now) {
        toast.error(`Task overdue: ${task.title}`);
      }
    }
  });
};

export const requestNotificationPermission = () => {
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notification");
    return;
  }
  Notification.requestPermission();
};

export const showNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
};
