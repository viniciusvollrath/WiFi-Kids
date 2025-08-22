import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ExternalLink } from 'lucide-react';

interface Step5Props {
  termsAccepted: boolean;
  onTermsAcceptedChange: (accepted: boolean) => void;
  t: (key: string) => string;
}

const termsContent = `
TERMS OF USE AND PRIVACY POLICY

Last updated: December 2024

1. INTRODUCTION
Welcome to Wi-Fi Kids, a parental control router system designed to help families manage internet access safely and responsibly. By using our service, you agree to these terms.

2. SERVICE DESCRIPTION
Wi-Fi Kids provides router firmware and companion software that enables parental controls, time management, and content filtering for home networks.

3. DATA COLLECTION AND PRIVACY
- We collect minimal data necessary for service operation
- Usage statistics are anonymized and used for service improvement
- No personal browsing data is stored on external servers
- All sensitive data remains on your local network

4. PARENTAL CONTROLS
- Parents/guardians are responsible for appropriate configuration
- The service is designed to assist, not replace, parental supervision
- We are not liable for content that may bypass filters

5. LIMITATION OF LIABILITY
The service is provided "as is" without warranties. We are not responsible for any damages arising from use of the service.

6. CHANGES TO TERMS
We may update these terms periodically. Continued use constitutes acceptance of changes.

7. CONTACT INFORMATION
For questions about these terms, please contact support@wifikids.com

By checking the box below, you acknowledge that you have read, understood, and agree to be bound by these terms.
`;

export const Step5Terms: React.FC<Step5Props> = ({
  termsAccepted,
  onTermsAcceptedChange,
  t
}) => {
  return (
    <Card className="w-full bg-gradient-card shadow-soft border-0">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">{t('step5.title')}</CardTitle>
        <CardDescription className="text-base">
          {t('step5.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border rounded-lg">
          <ScrollArea className="h-80 p-4">
            <div className="text-sm space-y-4 leading-relaxed">
              {termsContent.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-muted-foreground">
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={onTermsAcceptedChange}
          />
          <label 
            htmlFor="terms" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {t('step5.accept')}
          </label>
        </div>

        <div className="flex justify-center">
          <Button variant="outline" size="sm" className="text-xs">
            <ExternalLink className="w-3 h-3 mr-2" />
            {t('step5.viewTerms')}
          </Button>
        </div>

        {!termsAccepted && (
          <p className="text-xs text-destructive text-center">
            {t('step5.acceptRequired')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};