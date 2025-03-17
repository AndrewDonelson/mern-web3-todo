// file: client/src/components/layout/Footer.tsx
// description: Footer component that appears on all pages
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Github, Twitter, Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo & Description */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Web3 Todo</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              The decentralized task management application built on blockchain technology.
            </p>
            <div className="mt-4 flex gap-4">
              <a 
                href="https://github.com/AndrewDonelson/mern-web3-todo" 
                target="_blank" 
                rel="noreferrer"
                aria-label="GitHub"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="https://x.com/web3todo#fake" 
                target="_blank" 
                rel="noreferrer"
                aria-label="X"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com/web3todo#fake" 
                target="_blank" 
                rel="noreferrer"
                aria-label="Instagram"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="flex flex-col">
            <h3 className="mb-4 text-sm font-medium">Product</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Features
              </Link>
              <Link to="/#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                How it works
              </Link>
              <Link to="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Pricing
              </Link>
              <Link to="/faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                FAQ
              </Link>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col">
            <h3 className="mb-4 text-sm font-medium">Legal</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Cookie Policy
              </Link>
            </nav>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-muted-foreground md:text-left">
              &copy; {currentYear} Andrew Donelson. All rights reserved.
            </p>
            <p className="text-center text-sm text-muted-foreground md:text-right">
              Crafted with care by <a href="https://andrewdonelson.com" className="text-primary underline hover:no-underline">Andrew Donelson</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};