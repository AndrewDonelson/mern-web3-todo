// file: client/src/hooks/use-toast.ts
// description: Toast notification hook for providing feedback to users
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import { toast as sonnerToast, ToastT, Toaster } from 'sonner';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

/**
 * Custom hook for showing toast notifications
 * Uses sonner toast under the hood
 */
export const useToast = () => {
  const toast = ({ 
    title,
    description,
    variant = 'default',
    duration = 5000,
    action
  }: ToastProps) => {
    const toastOptions: Partial<ToastT> = {
      duration,
      className: getVariantClass(variant),
    };

    // Add action if provided
    if (action) {
      toastOptions.action = {
        label: action.label,
        onClick: action.onClick
      };
    }

    // If only title is provided, show simple toast
    if (title && !description) {
      return sonnerToast(title, toastOptions);
    }

    // If both title and description are provided
    return sonnerToast(title || '', {
      ...toastOptions,
      description
    });
  };

  return { toast, Toaster };
};

/**
 * Get the CSS class for the toast variant
 */
function getVariantClass(variant: ToastProps['variant']): string {
  switch (variant) {
    case 'destructive':
      return 'bg-destructive text-destructive-foreground';
    case 'success':
      return 'bg-green-500 text-white';
    case 'warning':
      return 'bg-yellow-500 text-white';
    default:
      return '';
  }
}