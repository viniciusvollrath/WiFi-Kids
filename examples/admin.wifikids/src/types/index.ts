export interface Country {
  code: string;
  name: string;
  timezone: string;
  languages: Language[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface ConfigurationData {
  // Step 1
  country: string;
  language: string;
  timezone: string;
  
  // Step 2
  adminUsername: string;
  adminPassword: string;
  
  // Step 3
  wifiSSID: string;
  wifiPassword: string;
  
  // Step 4
  studyTimeBlocks: TimeBlock[];
  blockingPeriods: {
    morning: { enabled: boolean; start: string; end: string };
    afternoon: { enabled: boolean; start: string; end: string };
    night: { enabled: boolean; start: string; end: string };
  };
  breakTime: {
    interval: number; // minutes
    duration: number; // minutes
  };
  agentProfile: 'maternal' | 'tutor' | 'general';
  weeklyReports: boolean;
  deviceManagement: Device[];
  
  // Step 5
  termsAccepted: boolean;
}

export interface TimeBlock {
  start: string;
  end: string;
  enabled: boolean;
}

export interface Device {
  name: string;
  mac: string;
  enabled: boolean;
}

export type ConfigurationStep = 1 | 2 | 3 | 4 | 5 | 6;