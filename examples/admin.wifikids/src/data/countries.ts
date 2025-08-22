import { Country } from '@/types';

export const countries: Country[] = [
  {
    code: 'US',
    name: 'United States',
    timezone: 'America/New_York',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' }
    ]
  },
  {
    code: 'BR',
    name: 'Brazil',
    timezone: 'America/Sao_Paulo',
    languages: [
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'ES',
    name: 'Spain',
    timezone: 'Europe/Madrid',
    languages: [
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'MX',
    name: 'Mexico',
    timezone: 'America/Mexico_City',
    languages: [
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    timezone: 'America/Toronto',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'fr', name: 'French', nativeName: 'Français' }
    ]
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    timezone: 'Europe/London',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  }
];