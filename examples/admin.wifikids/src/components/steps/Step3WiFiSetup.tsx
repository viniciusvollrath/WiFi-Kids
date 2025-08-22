import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wifi, Eye, EyeOff, Network } from 'lucide-react';

interface Step3Props {
  wifiSSID: string;
  wifiPassword: string;
  confirmWifiPassword: string;
  onSSIDChange: (ssid: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
  t: (key: string) => string;
}

export const Step3WiFiSetup: React.FC<Step3Props> = ({
  wifiSSID,
  wifiPassword,
  confirmWifiPassword,
  onSSIDChange,
  onPasswordChange,
  onConfirmPasswordChange,
  t
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = wifiPassword === confirmWifiPassword;
  const passwordValid = wifiPassword.length >= 8;

  return (
    <Card className="w-full bg-gradient-card shadow-soft border-0">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
          <Wifi className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">{t('step3.title')}</CardTitle>
        <CardDescription className="text-base">
          {t('step3.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="ssid" className="text-sm font-medium flex items-center gap-2">
            <Network className="w-4 h-4" />
            {t('step3.ssid')}
          </Label>
          <Input
            id="ssid"
            type="text"
            value={wifiSSID}
            onChange={(e) => onSSIDChange(e.target.value)}
            placeholder="Wi-Fi Kids"
            className="h-12 text-base"
          />
          <p className="text-xs text-muted-foreground">{t('step3.ssidHelp')}</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="wifiPassword" className="text-sm font-medium flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            {t('step3.password')}
          </Label>
          <div className="relative">
            <Input
              id="wifiPassword"
              type={showPassword ? "text" : "password"}
              value={wifiPassword}
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
          <p className="text-xs text-muted-foreground">{t('step3.passwordHelp')}</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="confirmWifiPassword" className="text-sm font-medium">
            {t('step3.confirmPassword')}
          </Label>
          <div className="relative">
            <Input
              id="confirmWifiPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmWifiPassword}
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
          {confirmWifiPassword && !passwordsMatch && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
          {confirmWifiPassword && passwordsMatch && (
            <p className="text-xs text-success">Passwords match ✓</p>
          )}
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wifi className="w-4 h-4" />
              <span className="font-medium">Security:</span>
              <span>WPA2/WPA3 encryption enabled</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};