import * as React from 'react';
import type { Settings, SettingsContextType, CustomImageAssets, Notification, NotificationType, NotificationContextValue } from '../types';
import { PREDEFINED_COLORS } from '../constants';

const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [configs, setConfigs] = React.useState<Settings[]>(() => {
    try {
      const stored = localStorage.getItem('linkDirectorSettings');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error reading configs from localStorage', error);
      return [];
    }
  });

  const [customImageAssets, setCustomImageAssets] = React.useState<CustomImageAssets>(() => {
    try {
      const stored = localStorage.getItem('linkDirectorAssets');
      if (!stored) return { icons: [], backgrounds: [] };
      const parsed = JSON.parse(stored);
      return parsed.icons && parsed.backgrounds ? parsed : { icons: [], backgrounds: [] };
    } catch (error) {
       console.error('Error reading assets from localStorage', error);
       return { icons: [], backgrounds: [] };
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('linkDirectorSettings', JSON.stringify(configs));
    } catch (error) {
      console.error('Error writing configs to localStorage', error);
    }
  }, [configs]);
  
  React.useEffect(() => {
    try {
      localStorage.setItem('linkDirectorAssets', JSON.stringify(customImageAssets));
    } catch (error) {
      console.error('Error writing assets to localStorage', error);
    }
  }, [customImageAssets]);

  const addConfig = (configData: Omit<Settings, 'id'>): Settings => {
    const newConfig: Settings = {
      ...configData,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    setConfigs(prev => [...prev, newConfig]);
    return newConfig;
  };

  const updateConfig = (id: string, updates: Partial<Omit<Settings, 'id'>>) => {
    setConfigs(prev => 
      prev.map(config => 
        config.id === id ? { ...config, ...updates } : config
      )
    );
  };

  const deleteConfig = (id: string) => {
    setConfigs(prev => prev.filter(config => config.id !== id));
  };
  
  const getConfig = (id: string): Settings | undefined => {
    return configs.find(config => config.id === id);
  };
  
  const addCustomAsset = (type: keyof CustomImageAssets, url: string) => {
      if (!url || typeof url !== 'string') return;
      setCustomImageAssets(prev => {
          const existingAssets = prev[type];
          if (existingAssets.includes(url)) {
              return prev;
          }
          return { ...prev, [type]: [url, ...existingAssets] };
      })
  }

  const deleteCustomAsset = (type: keyof CustomImageAssets, url: string) => {
    setCustomImageAssets(prev => ({
        ...prev,
        [type]: prev[type].filter(assetUrl => assetUrl !== url)
    }));
  };

  const value = {
    configs,
    addConfig,
    updateConfig,
    deleteConfig,
    getConfig,
    colors: PREDEFINED_COLORS,
    customImageAssets,
    addCustomAsset,
    deleteCustomAsset,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextType => {
  const context = React.useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};


// --- Notification System ---

const NotificationContext = React.createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const addNotification = React.useCallback((notification: Omit<Notification, 'id'>) => {
    const newNotification = { ...notification, id: Date.now() };
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000); // Auto-dismiss after 5 seconds
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): ((notification: Omit<Notification, 'id'>) => void) => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context.addNotification;
};

export const useNotifications = (): Notification[] => {
    const context = React.useContext(NotificationContext);
    if(!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context.notifications;
}