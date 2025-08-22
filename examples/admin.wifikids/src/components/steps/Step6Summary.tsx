import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Globe, Shield, Wifi, Users, FileText } from 'lucide-react';
import { ConfigurationData } from '@/types';
import { countries } from '@/data/countries';

interface Step6Props {
  config: ConfigurationData;
  onExportConfig: () => void;
  t: (key: string) => string;
}

export const Step6Summary: React.FC<Step6Props> = ({
  config,
  onExportConfig,
  t
}) => {
  const selectedCountry = countries.find(c => c.code === config.country);
  
  return (
    <Card className="w-full bg-gradient-card shadow-soft border-0">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-success rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">{t('step6.title')}</CardTitle>
        <CardDescription className="text-base">
          {t('step6.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location & Language */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Globe className="w-5 h-5 text-primary" />
            Location & Language
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-7">
            <div>
              <p className="text-xs text-muted-foreground">{t('step6.country')}</p>
              <p className="text-sm font-medium">{selectedCountry?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('step6.language')}</p>
              <p className="text-sm font-medium">{config.language.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('step6.timezone')}</p>
              <p className="text-sm font-medium">{selectedCountry?.timezone}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Admin Account */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Shield className="w-5 h-5 text-primary" />
            {t('step6.adminAccount')}
          </div>
          <div className="ml-7">
            <p className="text-xs text-muted-foreground">Username</p>
            <p className="text-sm font-medium">{config.adminUsername}</p>
          </div>
        </div>

        <Separator />

        {/* Wi-Fi Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Wifi className="w-5 h-5 text-primary" />
            {t('step6.wifiSettings')}
          </div>
          <div className="ml-7">
            <p className="text-xs text-muted-foreground">Network Name (SSID)</p>
            <p className="text-sm font-medium">{config.wifiSSID}</p>
          </div>
        </div>

        <Separator />

        {/* Parental Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Users className="w-5 h-5 text-primary" />
            {t('step6.parentalControls')}
          </div>
          <div className="ml-7 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Study Time Blocks</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {config.studyTimeBlocks
                  .filter(block => block.enabled)
                  .map((block, index) => (
                    <Badge key={index} variant="secondary">
                      {block.start} - {block.end}
                    </Badge>
                  ))}
              </div>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground">Blocking Periods</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {config.blockingPeriods.morning && <Badge variant="outline">Morning</Badge>}
                {config.blockingPeriods.afternoon && <Badge variant="outline">Afternoon</Badge>}
                {config.blockingPeriods.night && <Badge variant="outline">Night</Badge>}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Break Time</p>
              <p className="text-sm">Every {config.breakTime.interval} min → {config.breakTime.duration} min break</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Assistant Profile</p>
              <Badge>{config.agentProfile.charAt(0).toUpperCase() + config.agentProfile.slice(1)}</Badge>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Weekly Reports</p>
              <Badge variant={config.weeklyReports ? "default" : "secondary"}>
                {config.weeklyReports ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Terms */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold">
            <FileText className="w-5 h-5 text-primary" />
            Legal Agreement
          </div>
          <div className="ml-7">
            <Badge variant="default" className="bg-success">
              <CheckCircle className="w-3 h-3 mr-1" />
              Terms Accepted
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Export Option */}
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onExportConfig} className="gap-2">
            <Download className="w-4 h-4" />
            {t('step6.exportConfig')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};