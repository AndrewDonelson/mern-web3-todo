// file: client/src/pages/Landing/index.tsx
// description: Main landing page component for the Web3 Todo application
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle, 
  Github,
  Shield,
  Database,
  Wallet,
  ListTodo,
  Users,
  Moon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { HeroSection } from '@/components/Landing/HeroSection';
import { FeatureCard } from '@/components/Landing/FeatureCard';
import { Footer } from '@/components/layout/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Web3 Todo</span>
          </div>
          <nav className="hidden space-x-6 md:flex">
            <a href="#features" className="text-sm font-medium transition-colors hover:text-primary">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium transition-colors hover:text-primary">
              How it works
            </a>
            <a 
              href="https://github.com/your-repo/web3-todo" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:flex md:gap-2">
              <Link to="/login">
                <Button variant="outline" size="sm">Log in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
            <Button variant="outline" size="icon" className="md:hidden">
              <span className="sr-only">Toggle menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <section id="features" className="container py-16 md:py-24">
          <div className="mx-auto mb-12 max-w-[58rem] text-center">
            <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tighter md:text-5xl">
              Powerful features
            </h2>
            <p className="text-lg text-muted-foreground md:text-xl">
              Our Web3 Todo app combines traditional task management with blockchain security.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Immutable Records"
              description="Store your tasks securely on the blockchain with permanent records that can't be altered."
              Icon={Shield}
            />
            <FeatureCard
              title="Decentralized Storage"
              description="Your tasks are stored across a distributed network, eliminating single points of failure."
              Icon={Database}
            />
            <FeatureCard
              title="Wallet Authentication"
              description="No username or password needed. Connect with your crypto wallet for secure login."
              Icon={Wallet}
            />
            <FeatureCard
              title="Task Prioritization"
              description="Organize your tasks with priority levels and deadlines to stay on top of what matters."
              Icon={ListTodo}
            />
            <FeatureCard
              title="Collaborative Tasks"
              description="Share and assign tasks to team members for better collaboration."
              Icon={Users}
            />
            <FeatureCard
              title="Dark Mode Support"
              description="Easy on the eyes with full dark mode support for late-night productivity."
              Icon={Moon}
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container py-16 md:py-24">
          <div className="mx-auto mb-12 max-w-[58rem] text-center">
            <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tighter md:text-5xl">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground md:text-xl">
              Get started with Web3 Todo in just a few simple steps.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-xl font-bold">Connect your wallet</h3>
              <p className="text-muted-foreground">
                Connect with MetaMask or any Web3 wallet to securely log in to your account.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-xl font-bold">Create your tasks</h3>
              <p className="text-muted-foreground">
                Add tasks with descriptions, priorities, and deadlines to organize your workflow.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mb-2 text-xl font-bold">Track progress</h3>
              <p className="text-muted-foreground">
                Complete tasks and track your productivity with blockchain-verified records.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-muted py-16 md:py-24">
          <div className="container">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl">
                Ready to get started?
              </h2>
              <p className="text-lg text-muted-foreground md:text-xl">
                Join thousands of users organizing their tasks on the blockchain.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link to="/register">
                  <Button size="lg" className="gap-1">
                    Sign up for free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Log in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;