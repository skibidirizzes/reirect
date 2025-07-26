import * as React from 'react';
import type { PermissionType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
const RefreshCwIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>);
const MonitorIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>);
const SmartphoneIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>);

const PermissionInstructions: React.FC<{
  onRetry: () => void;
  requiredPermissions: PermissionType[];
}> = ({ onRetry, requiredPermissions }) => {
  const { t } = useLanguage();
  const [view, setView] = React.useState<'desktop' | 'mobile'>('desktop');

  const permissionNames = {
    camera: "Camera",
    microphone: "Microphone",
    location: "Location"
  };

  return (
    <div className="w-full max-w-lg bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-8 text-center text-white animate-fade-in-up">
        <div className="w-16 h-16 bg-red-500/20 text-red-400 flex items-center justify-center rounded-full border-2 border-red-500/50 mx-auto mb-6">
            <LockIcon className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-bold mb-2">{t('permission_instructions_title')}</h1>
        <p className="text-slate-400 mb-4">{t('permission_instructions_subtitle')}</p>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
            {requiredPermissions.map(perm => (
                <span key={perm} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm font-medium">
                    {permissionNames[perm]}
                </span>
            ))}
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4 text-left mb-6">
            <div className="flex border-b border-slate-700 mb-4">
                <button
                    onClick={() => setView('desktop')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-colors ${view === 'desktop' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
                >
                    <MonitorIcon className="w-5 h-5" /> {t('permission_instructions_show_desktop')}
                </button>
                <button
                    onClick={() => setView('mobile')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-colors ${view === 'mobile' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
                >
                    <SmartphoneIcon className="w-5 h-5" /> {t('permission_instructions_show_mobile')}
                </button>
            </div>
            
            <ul
              className="space-y-3 text-slate-300 text-sm"
              dangerouslySetInnerHTML={{ __html: t(view === 'desktop' ? 'permission_instructions_desktop_steps' : 'permission_instructions_mobile_steps') }}
            />
        </div>

        <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
        >
            <RefreshCwIcon className="w-5 h-5" />
            {t('permission_instructions_retry')}
        </button>
    </div>
  );
};

export default PermissionInstructions;
