import React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  strengthText: {
    weak: string;
    fair: string;
    good: string;
    strong: string;
  };
}

const calculatePasswordStrength = (password: string): number => {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  return Math.min(score, 4);
};

const getStrengthInfo = (strength: number, strengthText: PasswordStrengthIndicatorProps['strengthText']) => {
  switch (strength) {
    case 0:
    case 1:
      return { label: strengthText.weak, color: 'bg-destructive', width: '25%' };
    case 2:
      return { label: strengthText.fair, color: 'bg-warning', width: '50%' };
    case 3:
      return { label: strengthText.good, color: 'bg-accent', width: '75%' };
    case 4:
      return { label: strengthText.strong, color: 'bg-success', width: '100%' };
    default:
      return { label: strengthText.weak, color: 'bg-destructive', width: '0%' };
  }
};

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  strengthText
}) => {
  if (!password) return null;
  
  const strength = calculatePasswordStrength(password);
  const { label, color, width } = getStrengthInfo(strength, strengthText);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Password Strength</span>
        <span className={cn(
          "text-sm font-medium",
          strength <= 1 && "text-destructive",
          strength === 2 && "text-warning",
          strength === 3 && "text-accent",
          strength === 4 && "text-success"
        )}>
          {label}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={cn("h-2 rounded-full transition-all duration-300", color)}
          style={{ width }}
        />
      </div>
    </div>
  );
};