"use client";

import React from "react";
import { useTheme } from "../providers/ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 group"
      title={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      {/* Sun Icon */}
      <Sun
        className={`absolute h-5 w-5 transition-all duration-300 text-yellow-500 ${
          theme === "light"
            ? "scale-100 rotate-0 opacity-100"
            : "scale-0 rotate-90 opacity-0"
        }`}
      />

      {/* Moon Icon */}
      <Moon
        className={`absolute h-5 w-5 transition-all duration-300 text-blue-400 ${
          theme === "dark"
            ? "scale-100 rotate-0 opacity-100"
            : "scale-0 -rotate-90 opacity-0"
        }`}
      />

      {/* Hover effect ring */}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 transition-opacity duration-300" />
    </motion.button>
  );
};

export default ThemeToggle;