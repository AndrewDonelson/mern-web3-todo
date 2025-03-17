// file: client/src/pages/Landing/HeroSection.tsx
// description: Hero section component for the landing page
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HeroSection: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-background pt-16 md:pt-24 lg:pt-32">
      {/* Background decorative element */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10%] top-0 h-[1000px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/20 to-transparent opacity-30 blur-3xl" />
        <div className="absolute right-[-10%] bottom-0 h-[800px] w-[600px] rounded-full bg-gradient-to-t from-secondary/20 to-transparent opacity-30 blur-3xl" />
      </div>
      
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="mt-4 space-y-4">
            <h1 className="animate-fade-in-up font-heading text-4xl font-bold md:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Web3</span> Todo
              <span className="text-primary"> for the decentralized world</span>
            </h1>
            <p className="animate-fade-in-up text-xl text-muted-foreground [animation-delay:200ms] md:text-2xl">
              Securely manage your tasks on the blockchain with our decentralized todo application.
            </p>
          </div>

          <div className="mt-8 flex animate-fade-in-up flex-col gap-4 [animation-delay:400ms] sm:flex-row">
            <Link to="/register">
              <Button size="lg" className="gap-1 text-lg">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-lg">
                Log In
              </Button>
            </Link>
          </div>

          <div className="mt-12 w-full animate-fade-in-up [animation-delay:600ms] md:mt-16 lg:mt-20">
            <div className="relative mx-auto aspect-video max-w-4xl overflow-hidden rounded-lg border shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 p-2">
                <div className="relative flex h-full w-full flex-col overflow-hidden rounded-md bg-background p-1">
                  {/* Mock App Interface */}
                  <div className="flex h-8 items-center border-b px-4">
                    <div className="flex space-x-2">
                      <div className="h-3 w-3 rounded-full bg-destructive/80"></div>
                      <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="mx-auto text-xs font-medium">Web3 Todo App Dashboard</div>
                  </div>
                  <div className="flex flex-1">
                    {/* Sidebar */}
                    <div className="hidden w-48 flex-shrink-0 border-r bg-muted/30 md:block">
                      <div className="flex h-12 items-center border-b px-4 font-medium">Dashboard</div>
                      <div className="flex h-12 items-center border-b px-4 font-medium text-primary">My Tasks</div>
                      <div className="flex h-12 items-center border-b px-4 font-medium">Shared</div>
                      <div className="flex h-12 items-center border-b px-4 font-medium">Calendar</div>
                      <div className="flex h-12 items-center border-b px-4 font-medium">Settings</div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="flex-1 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold">Today's Tasks</h3>
                        <div className="h-8 w-24 rounded-md bg-primary"></div>
                      </div>
                      
                      {/* Task Items */}
                      <div className="space-y-2">
                        {[
                          { title: "Research Web3 technologies", completed: true },
                          { title: "Set up MetaMask wallet", completed: true },
                          { title: "Complete project proposal", completed: false },
                          { title: "Schedule team meeting", completed: false },
                          { title: "Review smart contract code", completed: false }
                        ].map((task, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-2 rounded-md border bg-card p-3"
                          >
                            <div className={`h-5 w-5 flex-shrink-0 rounded-sm border ${
                              task.completed ? 'bg-primary border-primary' : 'border-muted-foreground'
                            }`}></div>
                            <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 animate-fade-in-up [animation-delay:800ms]">
            <p className="mb-4 text-center text-sm text-muted-foreground">Trusted by developers and teams worldwide</p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {["Blockchain Verified", "256-bit Encryption", "Decentralized Storage", "Smart Contract Powered"].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};