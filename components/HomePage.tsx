import * as React from 'react';
import { Link } from 'react-router-dom';
import { useSettings, useNotification } from '../contexts/SettingsContext';
import type { Settings } from '../types';
import RedirectPage from './RedirectPage';
import { BITLY_API_TOKEN, BITLY_API_URL } from '../constants';
import QrCodeModal from './QrCodeModal';

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const MoreVerticalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
const BarChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>;
const RefreshCwIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>;
const QrCodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h.01"/><path d="M21 12h.01"/><path d="M12 21h.01"/></svg>;


const RedirectCard: React.FC<{
    config: Settings,
    clicks: number | undefined,
    onCopy: (link: string) => void,
    onPreview: (config: Settings) => void,
    onQrCode: (config: Settings) => void,
    onDelete: (id: string) => void,
}> = ({ config, clicks, onCopy, onPreview, onQrCode, onDelete }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
                                    <EditIcon /> Edit
                                </Link>
                                <button onClick={() => { setMenuOpen(false); if(config.bitlyLink) onQrCode(config); }} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600/50 w-full text-left transition-colors" disabled={!config.bitlyLink}>
                                    <QrCodeIcon /> QR Code
                                </button>
                                <button onClick={() => { setMenuOpen(false); onDelete(config.id); }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 w-full text-left transition-colors rounded-b-lg">
                                    <TrashIcon /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                 <div className="flex items-center gap-2 text-slate-400 bg-slate-900/50 p-2 rounded-lg">
                    <BarChartIcon />
                    <span className="font-medium text-white">{clicks ?? '--'}</span>
                    <span className="text-sm">Total Clicks</span>
                </div>
            </div>
            <div className="border-t border-slate-700/50 p-3 flex items-center gap-2">
                 <button onClick={() => onPreview(config)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors">
                    <EyeIcon /> Preview
                 </button>
                 <button onClick={() => config.bitlyLink && onCopy(config.bitlyLink)} disabled={!config.bitlyLink} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                    <CopyIcon /> Copy Link
                 </button>
            </div>
        </div>
    );
};

const HomePage: React.FC = () => {
  const { configs, deleteConfig } = useSettings();
  const addNotification = useNotification();
  const [previewConfig, setPreviewConfig] = React.useState<Settings | null>(null);
  const [qrCodeConfig, setQrCodeConfig] = React.useState<Settings | null>(null);
  const [clickCounts, setClickCounts] = React.useState<Record<string, number>>({});
  const [isLoadingStats, setIsLoadingStats] = React.useState(false);

  const fetchStats = React.useCallback(async () => {
    if (configs.length === 0) {
      setClickCounts({});
      return;
    }
    setIsLoadingStats(true);

    const results = await Promise.all(
      configs.map(async (config) => {
        if (config.bitlyId) {
          try {
            const response = await fetch(`${BITLY_API_URL}/bitlinks/${config.bitlyId}/clicks/summary`, {
              headers: { 'Authorization': `Bearer ${BITLY_API_TOKEN}` },
            });
            if (response.ok) {
              const data = await response.json();
              return { id: config.id, count: data.total_clicks };
            }
            console.warn(`Could not fetch stats for ${config.bitlyId}: ${response.statusText}`);
          } catch (e) {
            console.error('Failed to fetch clicks for', config.bitlyId, e);
          }
        }
        return { id: config.id, count: null };
      })
    );

    setClickCounts((prevCounts) => {
      const newCounts: Record<string, number> = {};
      const fetchedCounts: Record<string, number> = {};
      results.forEach(({ id, count }) => {
        if (count !== null) {
          fetchedCounts[id] = count;
        }
      });

      configs.forEach((config) => {
        newCounts[config.id] = fetchedCounts[config.id] ?? prevCounts[config.id] ?? 0;
      });

      return newCounts;
    });

    setIsLoadingStats(false);
  }, [configs]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);


  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
        addNotification({ type: 'success', message: 'Link copied to clipboard!' });
    }).catch(err => {
        console.error('Failed to copy link: ', err);
        addNotification({ type: 'error', message: 'Failed to copy link.' });
    });
  };
  
  const handlePreview = (config: Settings) => {
    setPreviewConfig(config);
  };

  const handleQrCode = (config: Settings) => {
      setQrCodeConfig(config);
  }
  
  const handleDelete = (id: string) => {
      if(window.confirm("Are you sure you want to delete this redirect? This action cannot be undone.")){
          deleteConfig(id);
          addNotification({ type: 'success', message: 'Redirect deleted.' });
      }
  }
  
  return (
    <div className="w-full h-full text-slate-300 p-4 sm:p-6 lg:p-8 overflow-y-auto dark">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className="w-14 h-14 bg-slate-800 text-indigo-400 flex items-center justify-center rounded-xl border border-slate-700">
                    <LinkIcon />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Link Director</h1>
                    <p className="text-slate-400">Manage your custom redirect links.</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchStats} disabled={isLoadingStats} className="flex items-center gap-2 px-4 py-3 bg-slate-700/50 text-slate-300 font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-wait">
                <RefreshCwIcon className={isLoadingStats ? 'animate-spin' : ''}/>
              </button>
              <Link
                to="/new"
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30"
                aria-label="Create New Redirect"
              >
                <PlusIcon />
                Create New
              </Link>
            </div>
        </header>

        {configs.length === 0 ? (
          <div className="text-center py-20 px-6 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 animate-fade-in">
            <div className="inline-block p-5 bg-slate-700/50 rounded-full mb-6">
                <LinkIcon />
            </div>
            <h2 className="text-2xl font-bold text-white">No redirects yet!</h2>
            <p className="text-slate-400 mt-2 mb-6 max-w-sm mx-auto">Your created redirects will appear here. Click the button below to get started.</p>
            <Link
              to="/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <PlusIcon />
              Create Your First Redirect
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map(config => (
              <RedirectCard 
                key={config.id} 
                config={config} 
                clicks={clickCounts[config.id]}
                onCopy={handleCopyLink}
                onPreview={handlePreview}
                onQrCode={handleQrCode}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewConfig && (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => setPreviewConfig(null)}
        >
            <div 
                className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md h-[75vh] flex flex-col overflow-hidden animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/70 flex-shrink-0">
                    <h3 className="font-semibold text-white text-lg">Live Preview</h3>
                    <button onClick={() => setPreviewConfig(null)} className="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors">Close</button>
                </div>
                <div className="w-full h-full border-0 relative">
                    <RedirectPage 
                        previewSettings={previewConfig}
                        isPreview={true}
                        onClosePreview={() => setPreviewConfig(null)}
                    />
                </div>
            </div>
        </div>
      )}
      
      {/* QR Code Modal */}
      {qrCodeConfig && (
        <QrCodeModal config={qrCodeConfig} onClose={() => setQrCodeConfig(null)} />
      )}
    </div>
  );
};

export default HomePage;