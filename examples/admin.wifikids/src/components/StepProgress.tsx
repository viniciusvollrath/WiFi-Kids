import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle } from 'lucide-react';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  stepIcons: React.ComponentType<any>[];
  stepTitles: string[];
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps,
  stepIcons,
  stepTitles
}) => {
  return (
    <div className="w-full">
      {/* Mobile: Compact progress bar */}
      <div className="md:hidden mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: Full step indicator */}
      <div className="hidden md:flex justify-between items-center mb-8">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const IconComponent = stepIcons[index];

          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center space-y-2">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted && "bg-success text-success-foreground shadow-medium",
                  isCurrent && "bg-primary text-primary-foreground shadow-medium animate-pulse-soft",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <IconComponent className="w-6 h-6" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium text-center max-w-20",
                  isCurrent && "text-primary",
                  isCompleted && "text-success",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}>
                  {stepTitles[index]}
                </span>
              </div>
              
              {/* Connecting line */}
              {index < totalSteps - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-4 transition-all duration-500",
                  stepNumber < currentStep && "bg-success",
                  stepNumber === currentStep && "bg-gradient-to-r from-primary to-muted",
                  stepNumber > currentStep && "bg-muted"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};