import * as React from 'react';
import type { Settings } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/SettingsContext';
import { XIcon, CopyIcon as CopyIconBase } from './Icons';

// Wrapper to adjust size
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => <CopyIconBase className={className} />;

const ShareModal: React.FC<{ config: Settings; onClose: () => void }> = ({ config, onClose }) => {
    const { t } = useLanguage();
    const addNotification = useNotification();
    const shareUrl = config.bitlyLink || '';
    const shareTitle = t('share_modal_share_text');

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            addNotification({ type: 'success', message: 'notification_link_copied' });
        });
    };

    const shareOptions = [
        { name: 'WhatsApp', iconUrl: 'https://static.vecteezy.com/system/resources/previews/016/716/480/non_2x/whatsapp-icon-free-png.png', url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + '\n' + shareUrl)}`, color: 'bg-[#25D366]' },
        { name: 'Telegram', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg', url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, color: 'bg-[#0088cc]' },
        { name: 'Facebook', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Facebook_Logo_2023.png/250px-Facebook_Logo_2023.png', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, color: 'bg-[#1877F2]' },
        { name: 'Email', iconUrl: 'https://cdn-icons-png.flaticon.com/512/6230/6230964.png', url: `mailto:?subject=${encodeURIComponent(t('share_modal_email_subject'))}&body=${encodeURIComponent(shareTitle + '\n\n' + shareUrl)}`, color: 'bg-[#ffffff]' },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/70">
                    <h3 className="font-semibold text-white text-lg">{t('share_modal_title')}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-6 bg-slate-900 flex flex-col items-center gap-5">
                    <p className="text-sm text-center text-slate-400">{t('share_modal_prompt')}</p>
                    <div className="w-full flex items-stretch bg-slate-800 border border-slate-700 rounded-lg p-1 overflow-hidden">
                        <input type="text" readOnly value={shareUrl} className="flex-grow bg-transparent text-indigo-400 font-mono p-2 text-sm outline-none" />
                        <button onClick={copyToClipboard} className="flex-shrink-0 px-3 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 transition-colors flex items-center gap-2 text-sm">
                            <CopyIcon className="w-4 h-4" /> {t('copy_link')}
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-3 w-full text-center">
                        {shareOptions.map(({ name, iconUrl, url, color }) => (
                            <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700/50 rounded-lg transition-colors">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${color}`}>
                                    <img src={iconUrl} alt={`${name} logo`} className="w-6 h-6 object-contain" />
                                </div>
                                <span className="text-xs text-slate-300 font-medium">{name}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;