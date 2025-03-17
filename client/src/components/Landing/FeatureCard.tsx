// file: client/src/pages/Landing/FeatureCard.tsx
// description: Feature card component for the landing page
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

import React from 'react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: keyof typeof Icons;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  className,
}) => {
  // Dynamically get the icon component
  const IconComponent = Icons[icon];

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md",
      className
    )}>
      <div className="absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 transform rounded-full bg-primary/10 transition-all duration-300 group-hover:scale-[1.5] group-hover:bg-primary/20" />
      
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {IconComponent && <IconComponent className="h-6 w-6" />}
      </div>
      
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};