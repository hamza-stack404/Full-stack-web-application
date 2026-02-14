"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Zap, Shield, Moon, Sun, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function HomePage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const features = [
    {
      icon: <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      title: "Smart Task Management",
      description: "Organize and prioritize your tasks with AI-powered insights and smart categorization."
    },
    {
      icon: <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      title: "Lightning Fast",
      description: "Built with Next.js and optimized for speed, ensuring seamless task management."
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      title: "Secure & Private",
      description: "Your data is encrypted and stored securely with industry-standard protocols."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TaskMaster
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="btn-outline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-12">
        {/* Hero Section */}
        <section className="text-center py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="heading-1 mb-6">
              <span className="block">Transform Your Productivity</span>
              <span className="gradient-text">With AI-Powered Task Management</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Streamline your workflow, prioritize effectively, and achieve more with our intelligent task management platform designed for modern professionals.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/signup"
                className="btn-primary flex items-center justify-center gap-2 px-8 py-3 text-lg"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="btn-outline flex items-center justify-center gap-2 px-8 py-3 text-lg"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="heading-2 mb-4">Powerful Features</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Everything you need to manage your tasks efficiently and boost productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card-hover p-6 text-center"
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="heading-3 mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="heading-2 mb-4">Ready to Transform Your Workflow?</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Join thousands of users who have revolutionized their productivity with our platform.
            </p>
            <Link
              href="/signup"
              className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg"
            >
              Start Your Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} TaskMaster. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}