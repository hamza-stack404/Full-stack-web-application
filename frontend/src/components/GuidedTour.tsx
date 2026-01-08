"use client";

import Joyride, { Step } from "react-joyride";

interface GuidedTourProps {
  run: boolean;
  onClose: () => void;
}

const steps: Step[] = [
  {
    target: ".add-task-form",
    content: "You can add a new task here. Just type in the task and press Enter.",
    placement: "bottom",
  },
  {
    target: ".task-list",
    content: "Your tasks will appear here.",
    placement: "top",
  },
  {
    target: ".filters",
    content: "You can filter and sort your tasks from here.",
    placement: "bottom",
  },
  {
    target: ".theme-toggle",
    content: "You can toggle between light and dark mode here.",
  },
  {
    target: ".dashboard-link",
    content: "You can navigate to the dashboard from here to see a summary of your tasks.",
  },
];

export default function GuidedTour({ run, onClose }: GuidedTourProps) {
  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={onClose}
      styles={{
        options: {
          zIndex: 10000,
        },
      }}
    />
  );
}
