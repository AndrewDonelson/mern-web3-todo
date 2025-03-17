// file: client/src/lib/utils.ts
// description: Utility functions for the application
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges multiple class names using clsx and tailwind-merge
 * This allows for conditional classes and proper handling of tailwind conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a wallet address to show only first and last few characters
 * Example: 0x1234...5678
 */
export function formatWalletAddress(address: string, frontChars = 6, endChars = 4): string {
  if (!address) return '';
  if (address.length <= frontChars + endChars) return address;
  
  return `${address.slice(0, frontChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats a date to a human-readable relative time string (e.g., "in 2 days" or "3 days ago")
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInMilliseconds = date.getTime() - now.getTime();
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  // Future date
  if (diffInMilliseconds > 0) {
    if (diffInMinutes < 60) {
      return `in ${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'}`;
    } else if (diffInHours < 24) {
      return `in ${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'}`;
    } else if (diffInDays < 30) {
      return `in ${diffInDays} ${diffInDays === 1 ? 'day' : 'days'}`;
    } else {
      return date.toLocaleDateString();
    }
  }
  // Past date
  else {
    const absDiffInMinutes = Math.abs(diffInMinutes);
    const absDiffInHours = Math.abs(diffInHours);
    const absDiffInDays = Math.abs(diffInDays);
    
    if (absDiffInMinutes < 60) {
      return `${absDiffInMinutes} ${absDiffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (absDiffInHours < 24) {
      return `${absDiffInHours} ${absDiffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (absDiffInDays < 30) {
      return `${absDiffInDays} ${absDiffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

/**
 * Delays execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely parses JSON without throwing an error
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    return fallback;
  }
}

/**
 * Generates a random ID for elements that need unique identifiers
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Truncates text to specified length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Handles copy to clipboard functionality
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Format a date to a short readable format (e.g., "Mar 15, 2025")
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}