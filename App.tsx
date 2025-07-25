import * as React from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';
import { SettingsProvider, NotificationProvider, useNotifications, useSettings } from './contexts/SettingsContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import RedirectPage from './components/RedirectPage';
import SettingsPage from './components/SettingsPage';
import HomePage from './components/HomePage';
import DataViewerPage from './components/DataViewerPage';
import type { Notification, NotificationType } from './types';

// --- Notification Components ---
const CheckCircleIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
const XCircleIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>);
const InfoSolidIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" stroke="black"/><line x1="12" y1="8" x2="12.01" y2="8" stroke="black"/></svg>);

const ICONS: Record<NotificationType, React.FC<{className?: string}>> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InfoSolidIcon,
};
const BG_COLORS: Record<NotificationType, string> = {
  success: 'bg-green-500 border-green-600',
  error: 'bg-red-600 border-red-700',
  info: 'bg-blue-500 border-blue-600',
};

const SingleNotification: React.FC<{ notification: Notification }> = ({ notification }) => {
  const Icon = ICONS[notification.type];
  const colorClasses = BG_COLORS[notification.type];
  const { t } = useLanguage();

  // The message can now be a key for translation
  const message = t(notification.message);

  return (
    <div className={`flex items-center gap-4 w-full p-4 rounded-xl shadow-2xl text-white font-semibold border animate-fade-in-up ${colorClasses}`}>
      <Icon className="w-6 h-6 flex-shrink-0" />
      <p className="flex-grow">{message}</p>
    </div>
  );
};

const NotificationContainer: React.FC = () => {
    const notifications = useNotifications();
    return (
        <div className="fixed bottom-4 right-4 z-[9999] w-full max-w-sm space-y-3">
            {notifications.map(n => (
                <SingleNotification key={n.id} notification={n} />
            ))}
        </div>
    );
}

const LoadingScreen: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="w-screen h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
            <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-400 font-semibold">{t('loading')}</p>
        </div>
    );
};


const AppContent: React.FC = () => {
    const { loading } = useSettings();

    if (loading) {
        return <LoadingScreen />;
    }

    return (
      <HashRouter>
        <div className="w-screen h-screen bg-slate-900 text-slate-300">
          <Switch>
            <Route path="/view/:data" component={RedirectPage} />
            <Route path="/edit/:id" component={SettingsPage} />
            <Route path="/new" component={SettingsPage} />
            <Route path="/data/:id" component={DataViewerPage} />
            <Route path="/" component={HomePage} />
          </Switch>
          <NotificationContainer />
        </div>
      </HashRouter>
    );
};

function App() {
  return (
    <LanguageProvider>
        <NotificationProvider>
            <SettingsProvider>
                <AppContent />
            </SettingsProvider>
        </NotificationProvider>
    </LanguageProvider>
  );
}

export default App;