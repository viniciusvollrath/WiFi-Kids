import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Clock, Users, BarChart3 } from 'lucide-react';
import { TimeBlock } from '@/types';

interface Step4Props {
  studyTimeBlocks: TimeBlock[];
  blockingPeriods: {
    morning: { enabled: boolean; start: string; end: string };
    afternoon: { enabled: boolean; start: string; end: string };
    night: { enabled: boolean; start: string; end: string };
  };
  breakTime: {
    interval: number;
    duration: number;
  };
  agentProfile: 'maternal' | 'tutor' | 'general';
  weeklyReports: boolean;
  onStudyTimeBlocksChange: (blocks: TimeBlock[]) => void;
  onBlockingPeriodsChange: (periods: { morning: { enabled: boolean; start: string; end: string }; afternoon: { enabled: boolean; start: string; end: string }; night: { enabled: boolean; start: string; end: string } }) => void;
  onBreakTimeChange: (breakTime: { interval: number; duration: number }) => void;
  onAgentProfileChange: (profile: 'maternal' | 'tutor' | 'general') => void;
  onWeeklyReportsChange: (enabled: boolean) => void;
  t: (key: string) => string;
}

export const Step4ParentalControls: React.FC<Step4Props> = ({
  studyTimeBlocks,
  blockingPeriods,
  breakTime,
  agentProfile,
  weeklyReports,
  onStudyTimeBlocksChange,
  onBlockingPeriodsChange,
  onBreakTimeChange,
  onAgentProfileChange,
  onWeeklyReportsChange,
  t
}) => {
  const updateStudyBlock = (index: number, field: 'start' | 'end' | 'enabled', value: string | boolean) => {
    const newBlocks = [...studyTimeBlocks];
    newBlocks[index] = { ...newBlocks[index], [field]: value };
    onStudyTimeBlocksChange(newBlocks);
  };

  return (
    <Card className="w-full bg-gradient-card shadow-soft border-0">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">{t('step4.title')}</CardTitle>
        <CardDescription className="text-base">
          {t('step4.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Study Time Blocks */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <Label className="text-base font-semibold">{t('step4.studyTime')}</Label>
          </div>
          <p className="text-sm text-muted-foreground">{t('step4.studyTimeHelp')}</p>
          
          <div className="space-y-3">
            {studyTimeBlocks.map((block, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <Switch
                  checked={block.enabled}
                  onCheckedChange={(enabled) => updateStudyBlock(index, 'enabled', enabled)}
                />
                <div className="flex items-center gap-1 sm:gap-2 flex-1">
                  <Input
                    type="time"
                    value={block.start}
                    onChange={(e) => updateStudyBlock(index, 'start', e.target.value)}
                    className="w-20 sm:w-32 text-xs sm:text-sm"
                    disabled={!block.enabled}
                  />
                  <span className="text-muted-foreground text-xs sm:text-sm">to</span>
                  <Input
                    type="time"
                    value={block.end}
                    onChange={(e) => updateStudyBlock(index, 'end', e.target.value)}
                    className="w-20 sm:w-32 text-xs sm:text-sm"
                    disabled={!block.enabled}
                  />
                </div>
                <span className="text-sm text-muted-foreground">Block {index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Blocking Periods */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">{t('step4.blockingPeriods')}</Label>
          <div className="space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('step4.morning')}</span>
                <Switch
                  checked={blockingPeriods.morning.enabled}
                  onCheckedChange={(enabled) => onBlockingPeriodsChange({ 
                    ...blockingPeriods, 
                    morning: { ...blockingPeriods.morning, enabled } 
                  })}
                />
              </div>
              {blockingPeriods.morning.enabled && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Input
                    type="time"
                    value={blockingPeriods.morning.start}
                    onChange={(e) => onBlockingPeriodsChange({ 
                      ...blockingPeriods, 
                      morning: { ...blockingPeriods.morning, start: e.target.value } 
                    })}
                    className="w-20 sm:w-32 text-xs sm:text-sm"
                  />
                  <span className="text-muted-foreground text-xs sm:text-sm">to</span>
                  <Input
                    type="time"
                    value={blockingPeriods.morning.end}
                    onChange={(e) => onBlockingPeriodsChange({ 
                      ...blockingPeriods, 
                      morning: { ...blockingPeriods.morning, end: e.target.value } 
                    })}
                    className="w-20 sm:w-32 text-xs sm:text-sm"
                  />
                </div>
              )}
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('step4.afternoon')}</span>
                <Switch
                  checked={blockingPeriods.afternoon.enabled}
                  onCheckedChange={(enabled) => onBlockingPeriodsChange({ 
                    ...blockingPeriods, 
                    afternoon: { ...blockingPeriods.afternoon, enabled } 
                  })}
                />
              </div>
              {blockingPeriods.afternoon.enabled && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Input
                    type="time"
                    value={blockingPeriods.afternoon.start}
                    onChange={(e) => onBlockingPeriodsChange({ 
                      ...blockingPeriods, 
                      afternoon: { ...blockingPeriods.afternoon, start: e.target.value } 
                    })}
                    className="w-20 sm:w-32 text-xs sm:text-sm"
                  />
                  <span className="text-muted-foreground text-xs sm:text-sm">to</span>
                  <Input
                    type="time"
                    value={blockingPeriods.afternoon.end}
                    onChange={(e) => onBlockingPeriodsChange({ 
                      ...blockingPeriods, 
                      afternoon: { ...blockingPeriods.afternoon, end: e.target.value } 
                    })}
                    className="w-20 sm:w-32 text-xs sm:text-sm"
                  />
                </div>
              )}
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('step4.night')}</span>
                <Switch
                  checked={blockingPeriods.night.enabled}
                  onCheckedChange={(enabled) => onBlockingPeriodsChange({ 
                    ...blockingPeriods, 
                    night: { ...blockingPeriods.night, enabled } 
                  })}
                />
              </div>
              {blockingPeriods.night.enabled && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Input
                    type="time"
                    value={blockingPeriods.night.start}
                    onChange={(e) => onBlockingPeriodsChange({ 
                      ...blockingPeriods, 
                      night: { ...blockingPeriods.night, start: e.target.value } 
                    })}
                    className="w-20 sm:w-32 text-xs sm:text-sm"
                  />
                  <span className="text-muted-foreground text-xs sm:text-sm">to</span>
                  <Input
                    type="time"
                    value={blockingPeriods.night.end}
                    onChange={(e) => onBlockingPeriodsChange({ 
                      ...blockingPeriods, 
                      night: { ...blockingPeriods.night, end: e.target.value } 
                    })}
                    className="w-20 sm:w-32 text-xs sm:text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Break Time Configuration */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">{t('step4.breakTime')}</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{t('step4.breakInterval')}</Label>
              <Input
                type="number"
                value={breakTime.interval}
                onChange={(e) => onBreakTimeChange({ ...breakTime, interval: parseInt(e.target.value) || 0 })}
                min="5"
                max="120"
                placeholder="20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t('step4.breakDuration')}</Label>
              <Input
                type="number"
                value={breakTime.duration}
                onChange={(e) => onBreakTimeChange({ ...breakTime, duration: parseInt(e.target.value) || 0 })}
                min="1"
                max="30"
                placeholder="5"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Agent Profile */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <Label className="text-base font-semibold">{t('step4.agentProfile')}</Label>
          </div>
          <Select value={agentProfile} onValueChange={onAgentProfileChange}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maternal">{t('step4.maternal')}</SelectItem>
              <SelectItem value="tutor">{t('step4.tutor')}</SelectItem>
              <SelectItem value="general">{t('step4.general')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Weekly Reports */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <Label className="text-base font-semibold">{t('step4.weeklyReports')}</Label>
            </div>
            <Switch
              checked={weeklyReports}
              onCheckedChange={onWeeklyReportsChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};