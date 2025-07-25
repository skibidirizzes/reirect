import * as React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider, NotificationProvider, useNotifications, useSettings } from './contexts/SettingsContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import RedirectPage from './components/RedirectPage';
import SettingsPage from './components/SettingsPage';
import HomePage from './components/HomePage';
import DataViewerPage from './components/DataViewerPage';
import type { Notification, NotificationType } from './types';

// --- Notification Components ---
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>);
const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>);
const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>);

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


const AppContent: React.FC = () => {
  const { loading } = useSettings();

  if (loading) {
    return (
      <div className="w-screen h-screen flex justify-center items-center bg-slate-900">
        <h1 className="text-2xl font-bold text-white">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-slate-900 font-sans">
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
