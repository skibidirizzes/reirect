import * as React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider, NotificationProvider, useNotifications, useSettings } from './contexts/SettingsContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import RedirectPage from './components/RedirectPage';
import SettingsPage from './components/SettingsPage';
import HomePage from './components/HomePage';
import DataViewerPage from './components/DataViewerPage';
import type { Notification, NotificationType } from './types';
import { CheckCircleIcon, XCircleIcon, InfoIcon, WifiOffIcon, LoaderIcon } from './components/Icons';


// --- Notification Components ---
const NOTIFICATION_ICONS: Record<NotificationType, React.FC<{ className?: string }>> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InfoIcon,
};

const NOTIFICATION_STYLES: Record<NotificationType, { base: string, icon: string }> = {
  success: { base: 'bg-green-600/90 border-green-500', icon: 'text-white' },
  error: { base: 'bg-red-600/90 border-red-500', icon: 'text-white' },
  info: { base: 'bg-blue-600/90 border-blue-500', icon: 'text-white' },
};

const NotificationContainer: React.FC = () => {
  const notifications = useNotifications();
  const { t } = useLanguage();

  const parseMessage = (message: string): { text: string; replacements: Record<string, string> } => {
    const match = message.match(/^(.*?),(.*)$/);
    if (match) {
        try {
            const replacements = JSON.parse(match[2]);
            return { text: match[1], replacements };
        } catch (e) {
            // Not a valid JSON, treat as a normal string
        }
    }
    return { text: message, replacements: {} };
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] w-full max-w-sm space-y-3">
      {notifications.map((notification) => {
        const Icon = NOTIFICATION_ICONS[notification.type];
        const styles = NOTIFICATION_STYLES[notification.type];
        const { text, replacements } = parseMessage(notification.message);
        
        return (
          <div key={notification.id} className={`flex items-start gap-4 p-4 rounded-lg border text-white shadow-2xl backdrop-blur-md animate-fade-in-up ${styles.base}`}>
            <Icon className={`w-6 h-6 flex-shrink-0 ${styles.icon}`} />
            <p className="text-sm font-semibold">{t(text, replacements)}</p>
          </div>
        );
      })}
    </div>
  );
};

const OfflineBanner: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-600/90 border-t border-yellow-500 text-white p-3 z-[10000] backdrop-blur-md animate-fade-in-up">
            <div className="max-w-6xl mx-auto flex items-center gap-4 text-center justify-center">
                <WifiOffIcon className="w-6 h-6 flex-shrink-0" />
                <div>
                    <h3 className="font-bold">{t('offline_banner_title')}</h3>
                    <p className="text-sm">{t('offline_banner_message')}</p>
                </div>
            </div>
        </div>
    );
};


const AppContent: React.FC = () => {
  const { loading } = useSettings();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col justify-center items-center bg-slate-900 text-white gap-4">
        <LoaderIcon className="w-16 h-16 animate-spin text-indigo-400" />
        <h1 className="text-2xl font-bold text-white">Initializing Director...</h1>
        <p className="text-slate-400">Please wait a moment.</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-slate-900 font-sans">
      {!isOnline && <OfflineBanner />}
      <Routes>
        <Route path="/view/:data" element={<RedirectPage />} />
        <Route path="/edit/:id" element={<SettingsPage />} />
        <Route path="/new" element={<SettingsPage />} />
        <Route path="/data/:id" element={<DataViewerPage />} />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <SettingsProvider>
          <HashRouter>
            <AppContent />
            <NotificationContainer />
          </HashRouter>
        </SettingsProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
};

export default App;