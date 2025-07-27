import * as React from 'react';
import type { PermissionType } from '../types';
import { LockIcon, RefreshCwIcon, MonitorIcon, SmartphoneIcon } from './Icons';

const permissionKeyMap: Record<PermissionType, string> = {
  camera: 'permission_name_camera',
  microphone: 'permission_name_microphone',
  location: 'permission_name_location',
  battery: 'permission_name_battery', // Included for type safety, though not expected in this component
};

const PermissionInstructions: React.FC<{
  onRetry: () => void;
  requiredPermissions: PermissionType[];
  t: (key: string, replacements?: Record<string, string | number>) => string;
}> = ({ onRetry, requiredPermissions, t }) => {
  const [view, setView] = React.useState<'desktop' | 'mobile'>('desktop');

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
                    {t(permissionKeyMap[perm])}
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