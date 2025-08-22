import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/data/countries';
import { Globe, Languages } from 'lucide-react';

interface Step1Props {
  selectedCountry: string;
  selectedLanguage: string;
  onCountryChange: (country: string) => void;
  onLanguageChange: (language: string) => void;
  t: (key: string) => string;
}

export const Step1CountryLanguage: React.FC<Step1Props> = ({
  selectedCountry,
  selectedLanguage,
  onCountryChange,
  onLanguageChange,
  t
}) => {
  const selectedCountryData = countries.find(c => c.code === selectedCountry);
  const availableLanguages = selectedCountryData?.languages || [];

  return (
    <Card className="w-full bg-gradient-card shadow-soft border-0">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">{t('step1.title')}</CardTitle>
        <CardDescription className="text-base">
          {t('step1.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="country" className="text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {t('step1.country')}
          </Label>
          <Select value={selectedCountry} onValueChange={onCountryChange}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder={t('step1.country')} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t('step1.countryHelp')}</p>
        </div>

        {selectedCountry && (
          <div className="space-y-3 animate-slide-in">
            <Label htmlFor="language" className="text-sm font-medium flex items-center gap-2">
              <Languages className="w-4 h-4" />
              {t('step1.language')}
            </Label>
            <Select value={selectedLanguage} onValueChange={onLanguageChange}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder={t('step1.language')} />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.nativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t('step1.languageHelp')}</p>
          </div>
        )}

        {selectedCountryData && (
          <div className="bg-muted/50 rounded-lg p-4 animate-slide-in">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">Timezone:</span>
                <span className="text-muted-foreground">{selectedCountryData.timezone}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};