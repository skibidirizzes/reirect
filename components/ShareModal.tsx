import * as React from 'react';
import type { Settings } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/SettingsContext';

const XIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>);
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M16.75 13.96c.25.13.43.2.5.28.07.08.1.18.1.28.02.1-.04.28-.08.38-.04.1-.1.18-.22.28s-.23.18-.35.2-.23.1-.35.1-.23.04-.35.04c-.13,0-.25,0-.38,0-.13,0-.25-.02-.38-.04a4.3 4.3 0 0 1-1.3-.44 6.4 6.4 0 0 1-2.1-1.46 6.6 6.6 0 0 1-1.48-2.14c-.18-.4-.3-.8-.4-1.2-.1-.4-.1-.8-.1-1.2 0-.13.02-.25.04-.38s.02-.25.04-.38.02-.23.04-.35.04-.23.08-.35c.04-.1.08-.2.13-.3.05-.1.1-.18.18-.25s.15-.15.22-.2.15-.1.22-.1.15,0,.22,0h.1c.08,0,.15,0,.22,0h.1c.08,0,.15,0,.22,0,.15.02.28.04.4.1.13.04.25.1.35.15s.2.1.3.15c.1.04.2.1.28.15.08.05.15.1.2.18a.5.5 0 0 1 .1.28c.02.1,0,.22-.04.35-.02.1-.08.2-.13.28s-.1.15-.18.2-.15.1-.2.15l-.25.13c-.08.04-.15.08-.2.13s-.1.1-.15.15c0,.05,0,.1,0,.13a3.5 3.5 0 0 0 .5 1.7 3.5 3.5 0 0 0 1.7.5Z" /><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" /></svg>);
const TelegramIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm5.5 8.5-2.2 7.7c-.1.5-.4.6-.8.4l-2.6-1.9-1.3-1.2c-.1-.1-.3-.3-.5,0l-.2 1.3-.3.8c-.1.4-.3.5-.6.5l.3-2.9 2.5-2.3c.1-.1,0-.2-.2,0l-3.1 2-.8.3c-.4,0-.6-.2-.7-.5l-1.2-3.9c-.2-.5,0-.8.4-.6l7.3 2.7c.3.1.5.3.4.7Z" /></svg>);
const TwitterIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm5,8.4c0,.1,0,.2,0,.3a6.8,6.8,0,0,1-6.9,6.9,6.9,6.9,0,0,1-3.7-1.1,5.1,5.1,0,0,0,.6,0,4.9,4.9,0,0,0,3-1A2.4,2.4,0,0,1,7.2,14a2.3,2.3,0,0,0,1.1-.1,2.4,2.4,0,0,1-1.9-2.3v0A2.4,2.4,0,0,0,7.5,12,2.4,2.4,0,0,1,7,8.8a6.8,6.8,0,0,0,4.9,2.5,2.4,2.4,0,0,1,4.1-2.2,4.7,4.7,0,0,0,1.5-.6,2.5,2.5,0,0,1-1.1,1.4,4.7,4.7,0,0,0,1.4-.4A5.2,5.2,0,0,1,17,10.4Z" /></svg>);
const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm2.3 6.9h-1.6c-.5 0-.6.2-.6.6v.9h2.2l-.3 2.2H12V18H9.3v-5.4H7V10h2.3V9.2c0-2.1 1.2-3.3 3.2-3.3h1.8v2Z" /></svg>);
const MailIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm3.5 12.8H8.4a.9.9 0 0 1-.9-.9V9.1a.9.9 0 0 1 .9-.9h7.2a.9.9 0 0 1 .9.9v3.8a.9.9 0 0 1-.9.9Z" /><path d="m12 12.4-4-2.4a.1.1 0 0 1 0-.2l4-2.4a.1.1 0 0 1 .1 0l4 2.4a.1.1 0 0 1 0 .2Z" /></svg>);

const ShareModal: React.FC<{ config: Settings; onClose: () => void }> = ({ config, onClose }) => {
    const { t } = useLanguage();
    const addNotification = useNotification();
    const shareUrl = config.bitlyLink || '';
    const shareTitle = t('share_modal_text', { name: config.name });

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            addNotification({ type: 'success', message: 'notification_link_copied' });
        });
    };

    const shareOptions = [
        { name: 'WhatsApp', icon: WhatsAppIcon, url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + '\n' + shareUrl)}`, color: 'bg-[#25D366]' },
        { name: 'Telegram', icon: TelegramIcon, url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, color: 'bg-[#0088cc]' },
        { name: 'X / Twitter', icon: TwitterIcon, url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, color: 'bg-[#1DA1F2]' },
        { name: 'Facebook', icon: FacebookIcon, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, color: 'bg-[#1877F2]' },
        { name: 'Email', icon: MailIcon, url: `mailto:?subject=${encodeURIComponent(config.name)}&body=${encodeURIComponent(shareTitle + '\n\n' + shareUrl)}`, color: 'bg-[#777777]' },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/70">
                    <h3 className="font-semibold text-white text-lg">{t('share_modal_title')}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-6 bg-slate-900 flex flex-col items-center gap-5">
                    <p className="text-sm text-center text-slate-400">{t('share_modal_text', { name: config.name })}</p>
                    <div className="w-full flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
                        <input type="text" readOnly value={shareUrl} className="flex-grow bg-transparent text-indigo-400 font-mono p-2 text-sm outline-none" />
                        <button onClick={copyToClipboard} className="flex-shrink-0 px-3 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 transition-colors flex items-center gap-2 text-sm">
                            <CopyIcon className="w-4 h-4" /> {t('copy_link')}
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 w-full text-center">
                        {shareOptions.map(({ name, icon: Icon, url, color }) => (
                            <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700/50 rounded-lg transition-colors">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${color}`}>
                                    <Icon className="w-6 h-6" />
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
