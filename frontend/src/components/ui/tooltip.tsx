"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TooltipProps {
  children: React.ReactNode;
  text: string;
}

export function Tooltip({ children, text }: TooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <p className="text-sm">{text}</p>
      </PopoverContent>
    </Popover>
  );
}
