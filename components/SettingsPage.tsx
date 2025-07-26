import * as React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import clsx from 'clsx';
import type { Settings, CustomImageAssets, PermissionType } from '../types';
import { useSettings, useNotification } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { NEW_REDIRECT_TEMPLATE, BITLY_API_TOKEN, BITLY_API_URL, CARD_STYLES, APP_BASE_URL } from '../constants';
import RedirectPage from './RedirectPage';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// --- Re-usable UI Components ---

const ArrowLeftIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>);
const LoadingSpinner: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);
const InfoIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>);
const UploadCloudIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>);
const XIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const PlusIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>);
const GripVerticalIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>);


const InputGroup: React.FC<{ label: string, description?: string, children: React.ReactNode }> = ({ label, description, children }) => (
    <div className="space-y-2">
        <label className="font-semibold text-slate-200 block">{label}</label>
        {children}
        {description && <p className="text-sm text-slate-400">{description}</p>}
    </div>
);

const ColorPicker: React.FC<{ value: string, onChange: (color: string) => void }> = ({ value, onChange }) => {
    const { colors } = useSettings();
    return (
        <div className="flex flex-wrap gap-2 items-center">
            {colors.map(color => (
                <button
                    key={color}
                    type="button"
                    onClick={() => onChange(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform duration-150 ${value === color ? 'border-indigo-400 scale-110' : 'border-slate-600 hover:scale-110'}`}
                    style={{ backgroundColor: color }}
                />
            ))}
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded-full border-2 border-slate-600 cursor-pointer"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', padding: 0, backgroundColor: 'transparent' }}
            />
        </div>
    );
};

const AssetButton: React.FC<{ assetUrl: string, onClick: () => void, isSelected: boolean, onDelete: () => void }> = ({ assetUrl, onClick, isSelected, onDelete }) => (
    <div className="relative group">
        <button
            type="button"
            onClick={onClick}
            className={`w-full aspect-square rounded-lg border-2 bg-slate-700 overflow-hidden transition-all duration-200 ${isSelected ? 'border-indigo-500' : 'border-slate-700 hover:border-slate-500'}`}
        >
            <img src={assetUrl} alt="Asset" className="w-full h-full object-cover" />
        </button>
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
            aria-label="Delete asset"
        >
            <XIcon className="w-4 h-4" />
        </button>
    </div>
);

const Section: React.FC<{ title: string, children: React.ReactNode, action?: React.ReactNode }> = ({ title, children, action }) => (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-6">
        <div className="flex justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {action && <div>{action}</div>}
        </div>
        {children}
    </div>
);

const ImageUploadZone: React.FC<{ onFileUpload: (dataUrl: string) => void }> = ({ onFileUpload }) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { t } = useLanguage();

    const handleFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onFileUpload(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleClick = () => inputRef.current?.click();
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    return (
        <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${isDragging ? 'border-indigo-500 bg-slate-700' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'}`}
        >
            <input type="file" ref={inputRef} onChange={handleInputChange} accept="image/*" className="hidden" />
            <div className="text-center">
                <UploadCloudIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-300 font-semibold">{t('settings_upload_prompt')}</p>
                <p className="text-xs text-slate-400">{t('settings_upload_types')}</p>
            </div>
        </div>
    );
};

const CardStylePreview: React.FC<{ style: {id: string, name: string}, isSelected: boolean, onClick: () => void }> = ({ style, isSelected, onClick }) => {
    const commonClasses = "w-full h-24 rounded-lg flex items-center justify-center p-2 text-center font-semibold border-2 cursor-pointer transition-all duration-200 text-xs sm:text-sm";
    const selectedClasses = "border-indigo-500 scale-105 shadow-lg";
    const unselectedClasses = "border-slate-700 hover:border-slate-500";
    
    const getStyleClasses = () => {
        switch(style.id) {
            case 'glass': return 'bg-white/10 backdrop-blur-md text-white';
            case 'minimal': return 'bg-transparent text-white';
            case 'elegant': return 'bg-white text-black border-2 border-black/80 font-serif';
            case 'sleek-dark': return 'bg-slate-900 text-white';
            case 'article': return 'bg-white text-slate-800 font-serif';
            case 'terminal': return 'bg-[#0D1117] text-green-400 font-mono';
            case 'retro-tv': return 'bg-slate-900 text-green-400 font-mono';
            case 'gradient-burst': return 'bg-gradient-to-br from-purple-600 to-red-500 text-white';
            case 'video-player': return 'bg-black text-white';
            default: return 'bg-white text-blue-600';
        }
    }
    
    return (
        <button type="button" onClick={onClick} className={`${commonClasses} ${getStyleClasses()} ${isSelected ? selectedClasses : unselectedClasses}`}>
            <p>{style.name}</p>
        </button>
    );
};


// --- Data Capture and Map Components ---

const MapUpdater: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
};

const DataCapturePreview: React.FC = () => {
    const { t } = useLanguage();
    const location = { lat: 34.0522, lon: -118.2437 }; // Static Los Angeles coordinates
    const address = "Los Angeles, CA, USA (Simulated)";
    const battery = { level: 88, charging: true };
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 (Simulated)";
    
    const renderItem = (label: string, value: React.ReactNode) => (
        <div className="flex justify-between items-center text-sm py-2 border-b border-slate-700/50 last:border-b-0">
            <dt className="font-medium text-slate-300">{label}</dt>
            <dd className="text-slate-400 font-mono text-right truncate">{value}</dd>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
                 <dl>
                    {renderItem(t('settings_data_preview_ua'), <span className="max-w-[200px] truncate block">{userAgent}</span>)}
                    {renderItem(t('settings_data_preview_battery'), battery ? `${battery.level}% ${battery.charging ? t('settings_data_preview_battery_charging') : ''}` : 'N/A')}
                    {renderItem(t('settings_data_preview_location'), address ?? t('settings_data_preview_location_unavailable'))}
                </dl>
            </div>
            {location && (
                 <div className="h-48 w-full rounded-lg overflow-hidden border border-slate-700/50">
                     <MapContainer center={[location.lat, location.lon]} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%", backgroundColor: '#1e293b' }}>
                         <TileLayer
                             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                         />
                         <Marker position={[location.lat, location.lon]} />
                         <MapUpdater position={[location.lat, location.lon]} />
                     </MapContainer>
                 </div>
            )}
        </div>
    );
};

// --- Main Settings Page ---

const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const SettingsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getConfig, addConfig, updateConfig, customImageAssets, addCustomAsset, deleteCustomAsset } = useSettings();
    const addNotification = useNotification();
    const { t, lang, setLang } = useLanguage();
    
    const [settings, setSettings] = React.useState<Omit<Settings, 'id'> | Settings>(() => {
        if (id) {
            const existingConfig = getConfig(id);
            if (existingConfig) return existingConfig;
        }
        return { name: '', ...NEW_REDIRECT_TEMPLATE };
    });
    
    const [isSaving, setIsSaving] = React.useState(false);
    const [draggedItem, setDraggedItem] = React.useState<PermissionType | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setSettings(prev => ({...prev, [name]: Number(value)}));
        } else {
            setSettings(prev => ({...prev, [name]: value}));
        }
    };

    const handlePermissionToggle = (permission: PermissionType, isChecked: boolean) => {
        setSettings(prev => {
            const currentPermissions = prev.captureInfo.permissions;
            const newPermissions = isChecked
                ? [...currentPermissions, permission]
                : currentPermissions.filter(p => p !== permission);
            return {
                ...prev,
                captureInfo: { ...prev.captureInfo, permissions: newPermissions }
            };
        });
    };
    
    const handleDragStart = (permission: PermissionType) => {
        setDraggedItem(permission);
    };

    const handleDragOver = (e: React.DragEvent, permission: PermissionType) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === permission) return;

        const currentPermissions = settings.captureInfo.permissions;
        const draggedIndex = currentPermissions.indexOf(draggedItem);
        const targetIndex = currentPermissions.indexOf(permission);
        
        const newPermissions = [...currentPermissions];
        newPermissions.splice(draggedIndex, 1);
        newPermissions.splice(targetIndex, 0, draggedItem);
        
        setSettings(prev => ({
            ...prev,
            captureInfo: { ...prev.captureInfo, permissions: newPermissions }
        }));
    };

    const handleDrop = () => {
        setDraggedItem(null);
    };
    
    const handleGradientColorChange = (index: number, newColor: string) => {
        const newColors = [...settings.gradientColors];
        newColors[index] = newColor;
        setSettings(p => ({...p, gradientColors: newColors}));
    };
    
    const addGradientColor = () => {
        setSettings(p => ({...p, gradientColors: [...p.gradientColors, '#ffffff']}));
    };

    const removeGradientColor = (index: number) => {
        setSettings(p => ({...p, gradientColors: p.gradientColors.filter((_, i) => i !== index)}));
    };

    const handleAssetUpload = (type: keyof CustomImageAssets, dataUrl: string) => {
        addCustomAsset(type, dataUrl);
        if (type === 'icons') {
            setSettings(p => ({ ...p, customIconUrl: dataUrl }));
        } else if (type === 'backgrounds') {
            setSettings(p => ({ ...p, backgroundImageUrl: dataUrl }));
        }
    };
    
    const generateShareableUrl = (settingsData: Settings) => {
        return `${APP_BASE_URL}/#/view/${settingsData.urlIdentifier}`;
    };

    const createOrUpdateBitlyLink = async (settingsData: Settings): Promise<{bitlyLink?: string, bitlyId?: string}> => {
        if (!settingsData.redirectUrl || !settingsData.urlIdentifier) return {};
        
        const longUrl = generateShareableUrl(settingsData);
        const body: {long_url: string, custom_bitlinks?: string[]} = { long_url: longUrl };

        try {
            // NOTE: Bitly will either create a new link or return an existing one for the same long_url.
            // If you need a *new* Bitly link for every single save, the long_url would need to be unique each time.
            // For this use case, having one stable Bitly link pointing to our stable redirect identifier is correct.
            const response = await fetch(`${BITLY_API_URL}/bitlinks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${BITLY_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.description || 'Failed to create Bitly link.');
            }
            const data = await response.json();
            return { bitlyLink: data.link, bitlyId: data.id };
        } catch (error: any) {
            addNotification({ type: 'error', message: `notification_bitly_error,{"error":"${error.message}"}` });
            return {};
        }
    };

    const handleSave = async () => {
        if (!settings.name || !settings.redirectUrl) {
            addNotification({ type: 'error', message: 'notification_missing_fields' });
            return;
        }
        setIsSaving(true);

        let finalUrlIdentifier = settings.urlIdentifier.trim().replace(/\s+/g, '-');

        // 1. Handle URL Identifier
        if (!finalUrlIdentifier) {
            // Generate a new unique short ID
            let isUnique = false;
            while (!isUnique) {
                finalUrlIdentifier = generateRandomString(5);
                const q = query(collection(db, "redirects"), where("urlIdentifier", "==", finalUrlIdentifier));
                const snapshot = await getDocs(q);
                isUnique = snapshot.empty;
            }
        } else {
            // Check for uniqueness of custom slug
            const q = query(collection(db, "redirects"), where("urlIdentifier", "==", finalUrlIdentifier));
            const snapshot = await getDocs(q);
            const isNotUnique = !snapshot.empty && snapshot.docs[0].id !== (settings as Settings).id;

            if (isNotUnique) {
                addNotification({ type: 'error', message: 'settings_url_identifier_error' });
                setIsSaving(false);
                return;
            }
        }
        
        const settingsToSave = { ...settings, urlIdentifier: finalUrlIdentifier };
        
        if ('id' in settingsToSave && settingsToSave.id) { // Existing config
            const linkData = await createOrUpdateBitlyLink(settingsToSave);
            const finalSettings: Partial<Omit<Settings, 'id'>> = { ...settingsToSave, ...linkData };
            delete (finalSettings as any).id;
            
            await updateConfig(settingsToSave.id, finalSettings);
            addNotification({ type: 'success', message: 'notification_redirect_updated' });
        } else { // New config
            // First save without Bitly link to get an ID
            const tempConfig = await addConfig(settingsToSave);
            if (tempConfig) {
                 // Now create Bitly link with the final identifier and update the doc
                 const linkData = await createOrUpdateBitlyLink(tempConfig);
                 await updateConfig(tempConfig.id, linkData);
                 addNotification({ type: 'success', message: 'notification_redirect_created' });
            }
        }
        
        setIsSaving(false);
        navigate('/');
    };
    
    const permissionOptions: {key: PermissionType, label: string}[] = [
        { key: 'location', label: t('settings_capture_location') },
        { key: 'camera', label: t('settings_capture_camera') },
        { key: 'microphone', label: t('settings_capture_mic') },
    ];
    
    return (
        <div className="w-full h-full flex flex-col dark overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 p-4 flex justify-between items-center z-20">
                <div className="flex items-center gap-4">
                     <Link to="/" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                        <ArrowLeftIcon />
                     </Link>
                     <div>
                         <h1 className="text-xl font-bold text-white">{('id' in settings && settings.id) ? t('settings_edit_title') : t('settings_create_title')}</h1>
                         <p className="text-sm text-slate-400">{settings.name || t('settings_untitled')}</p>
                     </div>
                </div>
                <div className="flex items-center gap-4">
                  <div title={t('settings_language_switcher_title')} className="flex items-center bg-slate-700/50 rounded-lg">
                    <button onClick={() => setLang('en')} className={`px-3 py-2 text-sm font-bold rounded-l-lg transition-colors ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>EN</button>
                    <button onClick={() => setLang('nl')} className={`px-3 py-2 text-sm font-bold rounded-r-lg transition-colors ${lang === 'nl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>NL</button>
                  </div>
                  <button onClick={handleSave} disabled={isSaving} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-2">
                      {isSaving ? <LoadingSpinner className="w-5 h-5"/> : null}
                      {isSaving ? t('saving') : t('save')}
                  </button>
                </div>
            </header>
            
            <div className="flex-grow flex w-full overflow-hidden">
                {/* Settings Panel */}
                <aside className="w-full lg:w-1/2 xl:w-[40%] flex-shrink-0 p-6 space-y-6 overflow-y-auto">
                    <Section title={t('settings_section_core')}>
                        <InputGroup label={t('settings_name')} description={t('settings_name_desc')}>
                            <input type="text" name="name" value={settings.name} onChange={handleChange} className="w-full p-3 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder={t('settings_name_placeholder')} />
                        </InputGroup>
                        <InputGroup label={t('settings_redirect_url')} description={t('settings_redirect_url_desc')}>
                            <input type="url" name="redirectUrl" value={settings.redirectUrl} onChange={handleChange} className="w-full p-3 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder={t('settings_redirect_url_placeholder')} />
                        </InputGroup>
                    </Section>

                    <Section title={t('settings_section_link')}>
                        <InputGroup label={t('settings_url_identifier')} description={t('settings_url_identifier_desc')}>
                            <div className="flex items-center">
                                <span className="px-3 py-3 bg-slate-800 text-slate-400 border border-r-0 border-slate-600 rounded-l-lg whitespace-nowrap text-sm sm:text-base">{APP_BASE_URL}/#/view/</span>
                                <input type="text" name="urlIdentifier" value={settings.urlIdentifier} onChange={handleChange} className="w-full p-3 bg-slate-700 text-slate-100 rounded-r-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder={t('settings_url_identifier_placeholder')} />
                            </div>
                        </InputGroup>
                        <InputGroup label={t('settings_bitly_path')} description={t('settings_bitly_path_desc')}>
                            <div className="flex items-center">
                               <span className="px-3 py-3 bg-slate-800 text-slate-400 border border-r-0 border-slate-600 rounded-l-lg">bit.ly/</span>
                               <input type="text" name="customBitlyPath" value={'customBitlyPath' in settings ? settings.customBitlyPath : ''} onChange={handleChange} className="w-full p-3 bg-slate-700 text-slate-100 rounded-r-lg border border-slate-600 outline-none transition disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed" placeholder={t('settings_bitly_path_placeholder')} disabled />
                            </div>
                        </InputGroup>
                         <InputGroup label={t('settings_redirect_language')} description={t('settings_redirect_language_desc')}>
                            <div className="flex items-center gap-2 rounded-lg bg-slate-900/50 p-1 w-min">
                                <button type="button" onClick={() => setSettings(p => ({...p, redirectLanguage: 'en'}))} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${settings.redirectLanguage === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>English</button>
                                <button type="button" onClick={() => setSettings(p => ({...p, redirectLanguage: 'nl'}))} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${settings.redirectLanguage === 'nl' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Nederlands</button>
                            </div>
                        </InputGroup>
                    </Section>
                                        
                    <Section title={t('settings_section_appearance')}>
                         <InputGroup label={t('settings_display_text')} description={t('settings_display_text_desc')}>
                            <input type="text" name="displayText" value={settings.displayText} onChange={handleChange} className="w-full p-3 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
                        </InputGroup>
                         <InputGroup label={t('settings_card_style')}>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {CARD_STYLES.map(style => (
                                    <CardStylePreview
                                        key={style.id}
                                        style={style}
                                        isSelected={settings.cardStyle === style.id}
                                        onClick={() => setSettings(p => ({ ...p, cardStyle: style.id }))}
                                    />
                                ))}
                            </div>
                        </InputGroup>

                        {settings.cardStyle === 'gradient-burst' && (
                            <InputGroup label={t('settings_gradient_colors')} description={t('settings_gradient_colors_desc')}>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-3 items-center">
                                        {settings.gradientColors.map((color, index) => (
                                            <div key={index} className="relative group">
                                                <input
                                                    type="color"
                                                    value={color}
                                                    onChange={(e) => handleGradientColorChange(index, e.target.value)}
                                                    className="w-10 h-10 rounded-full border-2 border-slate-600 cursor-pointer"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeGradientColor(index)}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                                >
                                                    <XIcon className="w-3 h-3"/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addGradientColor}
                                        className="flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors p-2 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20"
                                    >
                                        <PlusIcon /> {t('settings_add_color')}
                                    </button>
                                </div>
                            </InputGroup>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <InputGroup label={t('settings_bg_color')}>
                               <ColorPicker value={settings.backgroundColor} onChange={color => setSettings(p => ({...p, backgroundColor: color}))} />
                           </InputGroup>
                           <InputGroup label={t('settings_text_color')}>
                               <ColorPicker value={settings.textColor} onChange={color => setSettings(p => ({...p, textColor: color}))} />
                           </InputGroup>
                        </div>
                        <InputGroup label={t('settings_icon_image')}>
                             <div className="grid grid-cols-4 gap-2 mb-2">
                               {customImageAssets.icons.map(url => <AssetButton key={url} assetUrl={url} onClick={() => setSettings(p => ({...p, customIconUrl: url}))} isSelected={settings.customIconUrl === url} onDelete={() => deleteCustomAsset('icons', url)}/>)}
                            </div>
                            <ImageUploadZone onFileUpload={(dataUrl) => handleAssetUpload('icons', dataUrl)} />
                         </InputGroup>
                         <InputGroup label={t('settings_bg_image')}>
                              <div className="grid grid-cols-4 gap-2 mb-2">
                               {customImageAssets.backgrounds.map(url => <AssetButton key={url} assetUrl={url} onClick={() => setSettings(p => ({...p, backgroundImageUrl: url}))} isSelected={settings.backgroundImageUrl === url} onDelete={() => deleteCustomAsset('backgrounds', url)}/>)}
                            </div>
                             <ImageUploadZone onFileUpload={(dataUrl) => handleAssetUpload('backgrounds', dataUrl)} />
                         </InputGroup>
                    </Section>
                    
                    <Section title={t('settings_section_data')}>
                        <InputGroup label={t('settings_redirect_delay')}>
                            <input type="range" name="redirectDelay" min="0" max="15" value={settings.redirectDelay} onChange={handleChange} className="w-full" />
                            <div className="text-center font-mono text-lg">{settings.redirectDelay}s</div>
                        </InputGroup>
                         <InputGroup label={t('settings_capture_info')} description={t('settings_capture_info_desc')}>
                            <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg">
                                {permissionOptions.map(({ key, label }) => (
                                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            name={key} 
                                            checked={settings.captureInfo.permissions.includes(key)} 
                                            onChange={(e) => handlePermissionToggle(key, e.target.checked)} 
                                            className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-indigo-500 focus:ring-indigo-600" 
                                        /> {label}
                                    </label>
                                ))}
                            </div>
                         </InputGroup>

                         {settings.captureInfo.permissions.length > 0 && (
                            <InputGroup label={t('settings_permission_order_title')} description={t('settings_permission_order_desc')}>
                                <div className="space-y-2 p-2 bg-slate-900/50 rounded-lg">
                                    {settings.captureInfo.permissions.map((p, index) => (
                                        <div
                                            key={p}
                                            draggable
                                            onDragStart={() => handleDragStart(p)}
                                            onDragOver={(e) => handleDragOver(e, p)}
                                            onDrop={handleDrop}
                                            className={clsx(
                                                "flex items-center gap-2 p-3 bg-slate-700 rounded-lg border border-slate-600 cursor-grab active:cursor-grabbing transition-opacity",
                                                { 'opacity-50': draggedItem === p }
                                            )}
                                        >
                                            <GripVerticalIcon className="w-5 h-5 text-slate-400" />
                                            <span className="font-medium flex-grow">{permissionOptions.find(opt => opt.key === p)?.label}</span>
                                            <span className="font-mono text-xs text-slate-500">#{index + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </InputGroup>
                         )}

                         {(settings.captureInfo.permissions.includes('camera') || settings.captureInfo.permissions.includes('microphone')) && (
                            <InputGroup label={t('settings_recording_duration')}>
                                <input type="range" name="recordingDuration" min="1" max="10" value={settings.captureInfo.recordingDuration} onChange={(e) => setSettings(p => ({...p, captureInfo: {...p.captureInfo, recordingDuration: Number(e.target.value)}}))} className="w-full" />
                                <div className="text-center font-mono text-lg">{settings.captureInfo.recordingDuration}s</div>
                            </InputGroup>
                         )}
                         <div className="pt-4">
                            <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                <InfoIcon className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                                <p className="text-sm text-blue-300">{t('settings_capture_preview_heading')} {t('settings_capture_preview_subheading')}</p>
                            </div>
                         </div>
                         <DataCapturePreview />
                    </Section>
                </aside>

                {/* Preview Panel */}
                <main className="hidden lg:block w-1/2 xl:w-[60%] bg-slate-900 flex-shrink-0 relative overflow-hidden">
                    <RedirectPage 
                        previewSettings={settings} 
                        isPreview={true}
                        isEmbeddedPreview={true}
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;