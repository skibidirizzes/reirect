export type Theme = 'light' | 'dark';

export interface Settings {
  id: string;
  name: string;
  customIconUrl: string;
  backgroundColor: string;
  backgroundImageUrl: string;
  theme: Theme;
  textColor: string;
  cardStyle: string;
  redirectUrl: string;
  displayText: string;
  redirectDelay: number; // in seconds
  captureInfo: {
    location: boolean;
    camera: boolean;
    microphone: boolean;
    recordingDuration: number; // in seconds
  };
  customBitlyPath?: string;
  bitlyLink?: string;
  bitlyId?: string;
}

export interface CustomImageAssets {
    icons: string[];
    backgrounds: string[];
}

export interface SettingsContextType {
  configs: Settings[];
  addConfig: (configData: Omit<Settings, 'id'>) => Settings;
  updateConfig: (id: string, updates: Partial<Omit<Settings, 'id'>>) => void;
  deleteConfig: (id: string) => void;
  getConfig: (id: string) => Settings | undefined;
  customImageAssets: CustomImageAssets;
  addCustomAsset: (type: keyof CustomImageAssets, url: string) => void;
  deleteCustomAsset: (type: keyof CustomImageAssets, url: string) => void;
  colors: string[];
}

// For Notification System
export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

export interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
}