import * as React from 'react';
import { Link } from 'react-router-dom';
import { useSettings, useNotification } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { Settings } from '../types';
import RedirectPage from './RedirectPage';
import { BITLY_API_TOKEN, BITLY_API_URL } from '../constants';
import QrCodeModal from './QrCodeModal';
import ShareModal from './ShareModal';
import PasswordGate from './PasswordGate';
import { 
    PlusIconHome, CopyIcon, EditIcon, TrashIcon, LinkIcon, EyeIcon, 
    MoreVerticalIcon, BarChartIcon, RefreshCwIcon, QrCodeIcon, ShareIcon, 
    DatabaseIcon, RotateCcwIcon, ChevronDownIcon 
} from './Icons';

const RedirectCard: React.FC<{
    config: Settings,
    clicks: number | undefined,
    unreadCount: number,
    onCopy: (link: string) => void,
    onPreview: (config: Settings) => void,
    onQrCode: (config: Settings) => void,
    onShare: (config: Settings) => void,
    onDelete: (id: string) => void,
}> = ({ config, clicks, unreadCount, onCopy, onPreview, onQrCode, onShare, onDelete }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const cardButtonBaseClass = "w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-full";
    const secondaryButtonClass = `${cardButtonBaseClass} text-slate-300 bg-slate-700/50 hover:bg-slate-700`;
    const primaryButtonClass = `${cardButtonBaseClass} bg-indigo-600 hover:bg-indigo-500 text-white`;

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 transition-all duration-300 hover:border-slate-600 hover:bg-slate-800 flex flex-col animate-fade-in-up">
            <div className="flex-grow p-5 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                         {config.customIconUrl && (
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.backgroundColor }}>
                                <div className="w-full h-full">
                                    <img src={config.customIconUrl} alt="Custom Icon" className="w-full h-full object-contain p-1" />
                                </div>
                            </div>
                        )}
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-white truncate" title={config.name}>{config.name}</h3>
                            <a href={config.bitlyLink} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 truncate hover:underline" title={config.bitlyLink}>{config.bitlyLink || 'No short link'}</a>
                        </div>
                    </div>
                     <div className="relative" ref={menuRef}>
                        <button onClick={() => setMenuOpen(prev => !prev)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                            <MoreVerticalIcon />
                        </button>
                        {menuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-2xl z-10 animate-scale-in origin-top-right">
                                <Link to={`/edit/${config.id}`} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600/50 w-full text-left transition-colors rounded-t-lg">
                                    <EditIcon /> {t('edit')}
                                </Link>
                                <button onClick={() => { setMenuOpen(false); if(config.bitlyLink) onShare(config); }} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600/50 w-full text-left transition-colors" disabled={!config.bitlyLink}>
                                    <ShareIcon /> {t('home_share')}
                                </button>
                                <button onClick={() => { setMenuOpen(false); if(config.bitlyLink) onQrCode(config); }} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600/50 w-full text-left transition-colors" disabled={!config.bitlyLink}>
                                    <QrCodeIcon /> {t('home_qr_code')}
                                </button>
                                <div className="h-px bg-slate-600/50"></div>
                                <button onClick={() => { setMenuOpen(false); onDelete(config.id); }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 w-full text-left transition-colors rounded-b-lg">
                                    <TrashIcon /> {t('delete')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                 <div className="flex items-center gap-2 text-slate-400 bg-slate-900/50 p-2 rounded-lg">
                    <BarChartIcon />
                    <span className="font-medium text-white">{clicks ?? '--'}</span>
                    <span className="text-sm">{t('home_total_clicks')}</span>
                </div>
            </div>
            <div className="border-t border-slate-700/50 p-3 grid grid-cols-3 gap-2">
                 <button onClick={() => onPreview(config)} className={secondaryButtonClass}>
                    <EyeIcon /> {t('preview')}
                 </button>
                 <Link to={`/data/${config.id}`} className={`${secondaryButtonClass} relative`}>
                    <DatabaseIcon /> {t('home_view_data')}
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                            {unreadCount}
                        </span>
                    )}
                 </Link>
                 <button onClick={() => config.bitlyLink && onCopy(config.bitlyLink)} disabled={!config.bitlyLink} className={primaryButtonClass}>
                    <CopyIcon /> {t('copy_link')}
                 </button>
            </div>
        </div>
    );
};

const HomePage: React.FC = () => {
  const { configs, deleteConfig, restoreConfig, permanentlyDeleteConfig, unreadCounts } = useSettings();
  const addNotification = useNotification();
  const { lang, setLang, t } = useLanguage();
  const [previewConfig, setPreviewConfig] = React.useState<Settings | null>(null);
  const [qrCodeConfig, setQrCodeConfig] = React.useState<Settings | null>(null);
  const [shareConfig, setShareConfig] = React.useState<Settings | null>(null);
  const [clickCounts, setClickCounts] = React.useState<Record<string, number>>({});
  const [isLoadingStats, setIsLoadingStats] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isTrashOpen, setIsTrashOpen] = React.useState(false);

  const activeConfigs = React.useMemo(() => configs.filter(c => c.status !== 'trashed'), [configs]);
  const trashedConfigs = React.useMemo(() => configs.filter(c => c.status === 'trashed').sort((a,b) => (b.trashedAt || 0) - (a.trashedAt || 0)), [configs]);

  React.useEffect(() => {
    if (localStorage.getItem('dashboard_authenticated') === 'true') {
        setIsAuthenticated(true);
    }
  }, []);

  const handleAuthSuccess = () => {
    localStorage.setItem('dashboard_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const fetchStats = React.useCallback(async () => {
    if (configs.length === 0) {
      setClickCounts({});
      return;
    }
    setIsLoadingStats(true);

    const results = await Promise.all(
      configs.filter(c => c.bitlyId).map(async (config) => {
        try {
          const response = await fetch(`${BITLY_API_URL}/bitlinks/${config.bitlyId}/clicks/summary`, {
            headers: { 'Authorization': `Bearer ${BITLY_API_TOKEN}` },
          });
          if (response.ok) {
            const data = await response.json();
            return { id: config.id, count: data.total_clicks };
          }
        } catch (e) { console.error('Failed to fetch clicks for', config.bitlyId, e); }
        return { id: config.id, count: null };
      })
    );
    
    setClickCounts(prev => {
        const newCounts = {...prev};
        results.forEach(res => {
            if(res && res.count !== null) newCounts[res.id] = res.count;
        });
        return newCounts;
    });

    setIsLoadingStats(false);
  }, [configs]);

  React.useEffect(() => {
    if(isAuthenticated){
        fetchStats();
    }
  }, [fetchStats, isAuthenticated, activeConfigs.length]);


  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
        addNotification({ type: 'success', message: 'notification_link_copied' });
    }).catch(err => {
        console.error('Failed to copy link: ', err);
        addNotification({ type: 'error', message: 'notification_link_copy_failed' });
    });
  };
  
  const handleDelete = (id: string) => deleteConfig(id);
  const handleRestore = (id: string) => restoreConfig(id);
  const handlePermanentDelete = (id: string) => {
      if(window.confirm(t('home_delete_permanent_confirm'))){
          permanentlyDeleteConfig(id);
      }
  };

  if (!isAuthenticated) return <PasswordGate onSuccess={handleAuthSuccess} />;
  
  return (
    <div className="w-full h-full text-slate-300 p-4 sm:p-6 lg:p-8 overflow-y-auto dark">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className="w-14 h-14 bg-slate-800 text-indigo-400 flex items-center justify-center rounded-xl border border-slate-700">
                    <LinkIcon />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('home_title')}</h1>
                    <p className="text-slate-400">{t('home_subtitle')}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-700/50 rounded-lg">
                <button onClick={() => setLang('en')} className={`px-3 py-3 text-sm font-bold rounded-l-lg transition-colors ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>EN</button>
                <button onClick={() => setLang('nl')} className={`px-3 py-3 text-sm font-bold rounded-r-lg transition-colors ${lang === 'nl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>NL</button>
              </div>
              <button onClick={fetchStats} disabled={isLoadingStats} className="flex items-center gap-2 px-4 py-3 bg-slate-700/50 text-slate-300 font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-wait">
                <RefreshCwIcon className={isLoadingStats ? 'animate-spin' : ''}/>
              </button>
              <Link to="/new" className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
                <PlusIconHome /> {t('home_create_new')}
              </Link>
            </div>
        </header>

        {activeConfigs.length === 0 && trashedConfigs.length === 0 ? (
          <div className="text-center py-20 px-6 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 animate-fade-in">
            <div className="inline-block p-5 bg-slate-700/50 rounded-full mb-6"> <LinkIcon /> </div>
            <h2 className="text-2xl font-bold text-white">{t('home_no_redirects_title')}</h2>
            <p className="text-slate-400 mt-2 mb-6 max-w-sm mx-auto">{t('home_no_redirects_subtitle')}</p>
            <Link to="/new" className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">
              <PlusIconHome /> {t('home_create_first')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeConfigs.map(config => (
              <RedirectCard 
                key={config.id} config={config} clicks={clickCounts[config.id]} unreadCount={unreadCounts[config.id] || 0}
                onCopy={handleCopyLink} onPreview={setPreviewConfig} onQrCode={setQrCodeConfig} onShare={setShareConfig} onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        
        {trashedConfigs.length > 0 && (
            <div className="mt-12">
                <button onClick={() => setIsTrashOpen(!isTrashOpen)} className="w-full flex justify-between items-center p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                        <TrashIcon/>
                        <h2 className="text-xl font-bold text-white">{t('home_trash_title')}</h2>
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs font-bold rounded-full">{trashedConfigs.length}</span>
                    </div>
                    <ChevronDownIcon className={`transition-transform ${isTrashOpen ? 'rotate-180' : ''}`} />
                </button>
                {isTrashOpen && (
                    <div className="mt-4 space-y-3 animate-fade-in">
                        {trashedConfigs.map(config => {
                            const daysLeft = 30 - Math.floor((Date.now() - (config.trashedAt || 0)) / (1000 * 60 * 60 * 24));
                            return (
                                <div key={config.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center justify-between gap-4 animate-fade-in-up">
                                    <div>
                                        <p className="font-semibold text-white truncate">{config.name}</p>
                                        <p className="text-xs text-slate-400">{t('home_trash_days_left', { days: daysLeft > 0 ? daysLeft : 0 })}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => handleRestore(config.id)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors text-slate-300 bg-slate-700/50 hover:bg-slate-700">
                                            <RotateCcwIcon/> {t('home_trash_restore')}
                                        </button>
                                        <button onClick={() => handlePermanentDelete(config.id)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors text-red-400 bg-red-900/20 hover:bg-red-900/40">
                                            <TrashIcon/> {t('home_trash_delete_permanently')}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        )}
      </div>

      {previewConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setPreviewConfig(null)}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md h-[75vh] flex flex-col overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/70 flex-shrink-0">
                    <h3 className="font-semibold text-white text-lg">{t('preview')}</h3>
                    <button onClick={() => setPreviewConfig(null)} className="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors">{t('close')}</button>
                </div>
                <div className="w-full h-full border-0 relative">
                    <RedirectPage previewSettings={previewConfig} isPreview={true} onClosePreview={() => setPreviewConfig(null)} />
                </div>
            </div>
        </div>
      )}
      
      {qrCodeConfig && <QrCodeModal config={qrCodeConfig} onClose={() => setQrCodeConfig(null)} t={t} />}
      {shareConfig && <ShareModal config={shareConfig} onClose={() => setShareConfig(null)} />}
    </div>
  );
};

export default HomePage;