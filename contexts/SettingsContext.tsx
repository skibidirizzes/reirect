import * as React from 'react';
import type { Settings, SettingsContextType, CustomImageAssets, Notification, NotificationType, NotificationContextValue } from '../types';
import { PREDEFINED_COLORS } from '../constants';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [configs, setConfigs] = React.useState<Settings[]>([]);
  const [customImageAssets, setCustomImageAssets] = React.useState<CustomImageAssets>({ icons: [], backgrounds: [] });
  const [loading, setLoading] = React.useState(true);
  const addNotification = useNotification();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch configs
        const configsSnapshot = await getDocs(collection(db, "redirects"));
        const configsData = configsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Settings));
        setConfigs(configsData);

        // Fetch assets
        const assetsDocRef = doc(db, "assets", "user_assets");
        const assetsDoc = await getDoc(assetsDocRef);
        if (assetsDoc.exists()) {
          setCustomImageAssets(assetsDoc.data() as CustomImageAssets);
        } else {
           // Initialize asset document if it doesn't exist
           await setDoc(assetsDocRef, { icons: [], backgrounds: [] });
        }

      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
        addNotification({type: 'error', message: 'Could not load data from cloud.'});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addNotification]);


  const addConfig = async (configData: Omit<Settings, 'id'>): Promise<Settings | null> => {
    try {
      const docRef = await addDoc(collection(db, "redirects"), configData);
      const newConfig: Settings = { ...configData, id: docRef.id };
      setConfigs(prev => [...prev, newConfig]);
      return newConfig;
    } catch (error) {
      console.error("Error adding document: ", error);
      addNotification({type: 'error', message: 'Failed to save new redirect.'})
      return null;
    }
  };

  const updateConfig = async (id: string, updates: Partial<Omit<Settings, 'id'>>) => {
    const docRef = doc(db, "redirects", id);
    try {
      await updateDoc(docRef, updates);
      setConfigs(prev => 
        prev.map(config => 
          config.id === id ? { ...config, ...updates } : config
        )
      );
    } catch (error) {
       console.error("Error updating document: ", error);
       addNotification({type: 'error', message: 'Failed to update redirect.'})
    }
  };

  const deleteConfig = async (id: string) => {
    const docRef = doc(db, "redirects", id);
    try {
      await deleteDoc(docRef);
      setConfigs(prev => prev.filter(config => config.id !== id));
    } catch (error) {
       console.error("Error deleting document: ", error);
       addNotification({type: 'error', message: 'Failed to delete redirect.'})
    }
  };
  
  const getConfig = (id: string): Settings | undefined => {
    return configs.find(config => config.id === id);
  };
  
  const addCustomAsset = async (type: keyof CustomImageAssets, url: string) => {
      if (!url || typeof url !== 'string') return;
      const docRef = doc(db, "assets", "user_assets");
      try {
        await updateDoc(docRef, {
            [type]: arrayUnion(url)
        });
        setCustomImageAssets(prev => {
            const existingAssets = prev[type];
            if (existingAssets.includes(url)) return prev;
            return { ...prev, [type]: [url, ...existingAssets] };
        });
      } catch (error) {
        console.error("Error adding asset:", error);
        addNotification({type: 'error', message: `Failed to add ${type.slice(0, -1)}.`})
      }
  }

  const deleteCustomAsset = async (type: keyof CustomImageAssets, url: string) => {
    const docRef = doc(db, "assets", "user_assets");
    try {
        await updateDoc(docRef, {
            [type]: arrayRemove(url)
        });
        setCustomImageAssets(prev => ({
            ...prev,
            [type]: prev[type].filter(assetUrl => assetUrl !== url)
        }));
    } catch (error) {
        console.error("Error deleting asset:", error);
        addNotification({type: 'error', message: `Failed to delete ${type.slice(0, -1)}.`})
    }
  };

  const value = {
    configs,
    loading,
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