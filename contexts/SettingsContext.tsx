import * as React from 'react';
import type { Settings, SettingsContextType, CustomImageAssets, Notification, NotificationType, NotificationContextValue, CapturedData } from '../types';
import { PREDEFINED_COLORS } from '../constants';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, onSnapshot, query, orderBy } from 'firebase/firestore';

const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [configs, setConfigs] = React.useState<Settings[]>([]);
  const [customImageAssets, setCustomImageAssets] = React.useState<CustomImageAssets>({ icons: [], backgrounds: [] });
  const [loading, setLoading] = React.useState(true);
  const addNotification = useNotification();
  
  // For Real-time notifications
  const [totalCaptureCounts, setTotalCaptureCounts] = React.useState<Record<string, number>>({});
  const [unreadCounts, setUnreadCounts] = React.useState<Record<string, number>>({});
  const audioCtxRef = React.useRef<AudioContext | null>(null);

  const playNotificationSound = React.useCallback(() => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioCtx = audioCtxRef.current;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Low volume
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  }, []);

  React.useEffect(() => {
    // --- Data Fetching ---
    const fetchData = async () => {
      try {
        const configsSnapshot = await getDocs(collection(db, "redirects"));
        const configsData = configsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Settings));
        setConfigs(configsData);

        const assetsDocRef = doc(db, "assets", "user_assets");
        const assetsDoc = await getDoc(assetsDocRef);
        if (assetsDoc.exists()) setCustomImageAssets(assetsDoc.data() as CustomImageAssets);
        else await setDoc(assetsDocRef, { icons: [], backgrounds: [] });

      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
        addNotification({type: 'error', message: 'notification_data_load_failed'});
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // --- Real-time Capture Listener ---
    const q = query(collection(db, "captures"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const newTotalCounts: Record<string, number> = {};
        snapshot.forEach((doc) => {
            const capture = doc.data() as CapturedData;
            newTotalCounts[capture.redirectId] = (newTotalCounts[capture.redirectId] || 0) + 1;
        });

        // Check if a notification should be triggered
        const previousTotal = Object.values(totalCaptureCounts).reduce((a, b) => a + b, 0);
        const newTotal = Object.values(newTotalCounts).reduce((a, b) => a + b, 0);
        if (newTotal > previousTotal && previousTotal > 0) {
            playNotificationSound();
            addNotification({ type: 'info', message: 'notification_new_data' });
        }
        
        setTotalCaptureCounts(newTotalCounts);
        
        // Update unread counts based on localStorage
        const seenCountsStr = localStorage.getItem('seenCaptures');
        const seenCounts: Record<string, number> = seenCountsStr ? JSON.parse(seenCountsStr) : {};
        const newUnreadCounts: Record<string, number> = {};
        Object.keys(newTotalCounts).forEach(redirectId => {
            newUnreadCounts[redirectId] = newTotalCounts[redirectId] - (seenCounts[redirectId] || 0);
        });
        setUnreadCounts(newUnreadCounts);
    });

    return () => unsubscribe();
  }, [addNotification, playNotificationSound, totalCaptureCounts]); // totalCaptureCounts is a proxy to detect changes


  const clearUnreadCount = React.useCallback((redirectId: string) => {
    const seenCountsStr = localStorage.getItem('seenCaptures');
    const seenCounts: Record<string, number> = seenCountsStr ? JSON.parse(seenCountsStr) : {};
    
    seenCounts[redirectId] = totalCaptureCounts[redirectId] || 0;
    localStorage.setItem('seenCaptures', JSON.stringify(seenCounts));

    setUnreadCounts(prev => ({...prev, [redirectId]: 0 }));
  }, [totalCaptureCounts]);


  const addConfig = async (configData: Omit<Settings, 'id'>): Promise<Settings | null> => {
    try {
      const docRef = await addDoc(collection(db, "redirects"), configData);
      const newConfig: Settings = { ...configData, id: docRef.id };
      setConfigs(prev => [...prev, newConfig]);
      return newConfig;
    } catch (error) {
      console.error("Error adding document: ", error);
      addNotification({type: 'error', message: 'notification_redirect_save_failed'})
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
       addNotification({type: 'error', message: 'notification_redirect_update_failed'})
    }
  };

  const deleteConfig = async (id: string) => {
    const docRef = doc(db, "redirects", id);
    try {
      await deleteDoc(docRef);
      setConfigs(prev => prev.filter(config => config.id !== id));
    } catch (error) {
       console.error("Error deleting document: ", error);
       addNotification({type: 'error', message: 'notification_redirect_delete_failed'})
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
        const assetName = type === 'icons' ? 'notification_icon' : 'notification_background';
        addNotification({type: 'error', message: `notification_asset_add_failed,{asset:${assetName}}`})
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
        const assetName = type === 'icons' ? 'notification_icon' : 'notification_background';
        addNotification({type: 'error', message: `notification_asset_delete_failed,{asset:${assetName}}`})
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
    unreadCounts,
    clearUnreadCount,
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
    setNotifications(prev => [newNotification, ...prev]);
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