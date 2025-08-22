import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StepProgress } from '@/components/StepProgress';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { ConfigurationData, ConfigurationStep } from '@/types';
import { countries } from '@/data/countries';

// Step components
import { Step1CountryLanguage } from '@/components/steps/Step1CountryLanguage';
import { Step2AdminSetup } from '@/components/steps/Step2AdminSetup';
import { Step3WiFiSetup } from '@/components/steps/Step3WiFiSetup';
import { Step4ParentalControls } from '@/components/steps/Step4ParentalControls';
import { Step5Terms } from '@/components/steps/Step5Terms';
import { Step6Summary } from '@/components/steps/Step6Summary';

// Icons for step progress
import { Globe, Shield, Wifi, Users, FileText, CheckCircle } from 'lucide-react';

const STEP_ICONS = [Globe, Shield, Wifi, Users, FileText, CheckCircle];

export const ConfigurationWizard: React.FC = () => {
  const { t, setLanguage, currentLanguage } = useTranslation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<ConfigurationStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 2 additional states
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 3 additional states
  const [confirmWifiPassword, setConfirmWifiPassword] = useState('');

  const [config, setConfig] = useState<ConfigurationData>({
    // Step 1
    country: '',
    language: 'en',
    timezone: '',
    
    // Step 2
    adminUsername: 'admin',
    adminPassword: '',
    
    // Step 3
    wifiSSID: 'Wi-Fi Kids',
    wifiPassword: '',
    
    // Step 4
    studyTimeBlocks: [
      { start: '09:00', end: '12:00', enabled: true },
      { start: '14:00', end: '17:00', enabled: true },
      { start: '19:00', end: '21:00', enabled: false }
    ],
    blockingPeriods: {
      morning: { enabled: false, start: '06:00', end: '12:00' },
      afternoon: { enabled: false, start: '12:00', end: '18:00' },
      night: { enabled: true, start: '18:00', end: '06:00' }
    },
    breakTime: {
      interval: 20,
      duration: 5
    },
    agentProfile: 'tutor',
    weeklyReports: true,
    deviceManagement: [],
    
    // Step 5
    termsAccepted: false
  });

  // Update language when selection changes
  useEffect(() => {
    if (config.language && config.language !== currentLanguage) {
      setLanguage(config.language as 'en' | 'pt' | 'es');
    }
  }, [config.language, setLanguage, currentLanguage]);

  // Update timezone when country changes
  useEffect(() => {
    if (config.country) {
      const selectedCountry = countries.find(c => c.code === config.country);
      if (selectedCountry) {
        setConfig(prev => ({ ...prev, timezone: selectedCountry.timezone }));
      }
    }
  }, [config.country]);

  const updateConfig = (updates: Partial<ConfigurationData>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const validateStep = (step: ConfigurationStep): boolean => {
    switch (step) {
      case 1:
        return !!config.country && !!config.language;
      case 2:
        return !!config.adminUsername && 
               config.adminPassword.length >= 8 && 
               config.adminPassword === confirmPassword;
      case 3:
        return !!config.wifiSSID && 
               config.wifiPassword.length >= 8 && 
               config.wifiPassword === confirmWifiPassword;
      case 4:
        return config.breakTime.interval > 0 && config.breakTime.duration > 0;
      case 5:
        return config.termsAccepted;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before proceeding.",
        variant: "destructive"
      });
      return;
    }

    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as ConfigurationStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as ConfigurationStep);
    }
  };

  const handleFinalSave = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Configuration Saved!",
        description: "Your Wi-Fi Kids router has been configured successfully.",
        variant: "default"
      });
      
      // Here you would typically send the config to your backend
      console.log('Final configuration:', config);
      
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an error saving your configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportConfiguration = () => {
    const configBlob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(configBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wifi-kids-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Configuration Exported",
      description: "Your configuration has been downloaded as a backup file.",
    });
  };

  const stepTitles = [
    t('step1.title'),
    t('step2.title'),
    t('step3.title'),
    t('step4.title'),
    t('step5.title'),
    t('step6.title')
  ];

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1CountryLanguage
            selectedCountry={config.country}
            selectedLanguage={config.language}
            onCountryChange={(country) => updateConfig({ country })}
            onLanguageChange={(language) => updateConfig({ language })}
            t={t}
          />
        );
      case 2:
        return (
          <Step2AdminSetup
            adminUsername={config.adminUsername}
            adminPassword={config.adminPassword}
            confirmPassword={confirmPassword}
            onUsernameChange={(username) => updateConfig({ adminUsername: username })}
            onPasswordChange={(password) => updateConfig({ adminPassword: password })}
            onConfirmPasswordChange={setConfirmPassword}
            t={t}
          />
        );
      case 3:
        return (
          <Step3WiFiSetup
            wifiSSID={config.wifiSSID}
            wifiPassword={config.wifiPassword}
            confirmWifiPassword={confirmWifiPassword}
            onSSIDChange={(ssid) => updateConfig({ wifiSSID: ssid })}
            onPasswordChange={(password) => updateConfig({ wifiPassword: password })}
            onConfirmPasswordChange={setConfirmWifiPassword}
            t={t}
          />
        );
      case 4:
        return (
          <Step4ParentalControls
            studyTimeBlocks={config.studyTimeBlocks}
            blockingPeriods={config.blockingPeriods}
            breakTime={config.breakTime}
            agentProfile={config.agentProfile}
            weeklyReports={config.weeklyReports}
            onStudyTimeBlocksChange={(blocks) => updateConfig({ studyTimeBlocks: blocks })}
            onBlockingPeriodsChange={(periods) => updateConfig({ blockingPeriods: periods })}
            onBreakTimeChange={(breakTime) => updateConfig({ breakTime })}
            onAgentProfileChange={(profile) => updateConfig({ agentProfile: profile })}
            onWeeklyReportsChange={(enabled) => updateConfig({ weeklyReports: enabled })}
            t={t}
          />
        );
      case 5:
        return (
          <Step5Terms
            termsAccepted={config.termsAccepted}
            onTermsAcceptedChange={(accepted) => updateConfig({ termsAccepted: accepted })}
            t={t}
          />
        );
      case 6:
        return (
          <Step6Summary
            config={config}
            onExportConfig={exportConfiguration}
            t={t}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Wi-Fi Kids Setup
            </h1>
            <p className="text-muted-foreground text-lg">
              Configure your parental control router in just a few steps
            </p>
          </div>

          {/* Progress indicator */}
          <StepProgress
            currentStep={currentStep}
            totalSteps={6}
            stepIcons={STEP_ICONS}
            stepTitles={stepTitles}
          />

          {/* Step content */}
          <div className="mb-8 animate-slide-in">
            {renderCurrentStep()}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="min-w-24"
            >
              {t('back')}
            </Button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{currentStep} of 6</span>
            </div>

            {currentStep < 6 ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="min-w-24"
              >
                {t('next')}
              </Button>
            ) : (
              <Button
                onClick={handleFinalSave}
                disabled={!validateStep(currentStep) || isLoading}
                className="min-w-32"
              >
                {isLoading ? 'Saving...' : t('save')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};