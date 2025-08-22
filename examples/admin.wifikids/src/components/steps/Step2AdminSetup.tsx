import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { Shield, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Step2Props {
  adminUsername: string;
  adminPassword: string;
  confirmPassword: string;
  onUsernameChange: (username: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
  t: (key: string) => string;
}

export const Step2AdminSetup: React.FC<Step2Props> = ({
  adminUsername,
  adminPassword,
  confirmPassword,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  t
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = adminPassword === confirmPassword;
  const passwordValid = adminPassword.length >= 8;

  const strengthText = {
    weak: t('passwordStrength.weak'),
    fair: t('passwordStrength.fair'),
    good: t('passwordStrength.good'),
    strong: t('passwordStrength.strong')
  };

  return (
    <Card className="w-full bg-gradient-card shadow-soft border-0">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">{t('step2.title')}</CardTitle>
        <CardDescription className="text-base">
          {t('step2.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-accent/20 bg-accent/10">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {t('step2.securityTip')}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('step2.username')}
          </Label>
          <Input
            id="username"
            type="text"
            value={adminUsername}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="admin"
            className="h-12 text-base"
          />
          <p className="text-xs text-muted-foreground">{t('step2.usernameHelp')}</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {t('step2.password')}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={adminPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••"
              className="h-12 text-base pr-12"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-10 w-10"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t('step2.passwordHelp')}</p>
          
          <PasswordStrengthIndicator 
            password={adminPassword} 
            strengthText={strengthText}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            {t('step2.confirmPassword')}
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              placeholder="••••••••"
              className="h-12 text-base pr-12"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-10 w-10"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
          {confirmPassword && passwordsMatch && (
            <p className="text-xs text-success">Passwords match ✓</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};