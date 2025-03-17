// file: client/src/components/layout/AuthLayout.tsx
// description: Layout component for authentication pages
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Background decorations */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/3 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/10 to-transparent opacity-30 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-gradient-to-t from-secondary/10 to-transparent opacity-30 blur-3xl" />
      </div>
      
      {/* Theme toggle in the top right */}
      <div className="absolute right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Main content area */}
      <main className="flex flex-1 items-center justify-center py-12">
        {children}
      </main>
      
      {/* Simple footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Web3 Todo. All rights reserved.</p>
      </footer>
    </div>
  );
};