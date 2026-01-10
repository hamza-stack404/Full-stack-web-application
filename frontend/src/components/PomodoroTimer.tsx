'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PomodoroTimerProps {
  taskTitle?: string;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ taskTitle }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work'); // work or break
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const workDuration = 25 * 60; // 25 minutes
  const breakDuration = 5 * 60; // 5 minutes

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Timer completed
            clearInterval(intervalRef.current as NodeJS.Timeout);
            
            // Switch mode when timer completes
            if (mode === 'work') {
              setMode('break');
              setTimeLeft(breakDuration);
              // TODO: Show notification for break time
            } else {
              setMode('work');
              setTimeLeft(workDuration);
              setSessionCount(prev => prev + 1);
              // TODO: Show notification for work time
            }
            setIsActive(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, mode]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'work') {
      setTimeLeft(workDuration);
    } else {
      setTimeLeft(breakDuration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'work' 
    ? (workDuration - timeLeft) / workDuration 
    : (breakDuration - timeLeft) / breakDuration;

  return (
    <motion.div 
      className="card p-6 w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          {mode === 'work' ? 'Focus Time' : 'Break Time'}
        </h3>
        
        {taskTitle && (
          <p className="text-sm text-muted mb-4 truncate">{taskTitle}</p>
        )}
        
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-200 dark:text-slate-700"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - 283 * progress}
              transform="rotate(-90 50 50)"
              className={
                mode === 'work' 
                  ? 'text-blue-500 dark:text-blue-400' 
                  : 'text-green-500 dark:text-green-400'
              }
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - 283 * progress }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-muted capitalize">
              {mode}
            </span>
          </div>
        </div>
        
        <div className="flex justify-center gap-3 mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className={`p-3 rounded-full ${
              isActive 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            aria-label={isActive ? 'Pause timer' : 'Start timer'}
          >
            {isActive ? <Pause size={20} /> : <Play size={20} />}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetTimer}
            className="p-3 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200"
            aria-label="Reset timer"
          >
            <RotateCcw size={20} />
          </motion.button>
        </div>
        
        <div className="flex justify-center gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < sessionCount 
                  ? 'bg-blue-500 dark:bg-blue-400' 
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PomodoroTimer;