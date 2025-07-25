import * as React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import clsx from 'clsx';
import { GoogleGenAI } from '@google/genai';
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
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${value === color ? 'border-indigo-400 scale-110' : 'border-slate-600'}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                />
            ))}
             <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-10 h-10 rounded-full border-2 border-slate-600 cursor-pointer"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', padding: 0, backgroundColor: 'transparent' }}
            />
        </div>
    );
};

const ImagePicker: React.FC<{
    title: string;
    description: string;
    assets: string[];
    selected: string;
    onSelect: (url: string) => void;
    onAdd: (url: string) => void;
    onDelete: (url: string) => void;
    assetType: keyof CustomImageAssets;
}> = ({ title, description, assets, selected, onSelect, onAdd, onDelete, assetType }) => {
    const { t } = useLanguage();
    const [newUrl, setNewUrl] = React.useState('');

    const handleAdd = () => {
        if (newUrl.trim()) {
            onAdd(newUrl.trim());
            setNewUrl('');
        }
    };

    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-slate-200">{title}</h3>
            <p className="text-sm text-slate-400 -mt-2">{description}</p>
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
                <button
                    type="button"
                    onClick={() => onSelect('')}
                    className={clsx(
                        "aspect-square rounded-lg flex items-center justify-center text-xs font-semibold border-2 transition-all",
                        !selected ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                    )}
                >
                    None
                </button>
                {assets.map(url => (
                    <div key={url} className="relative group">
                        <button
                            type="button"
                            onClick={() => onSelect(url)}
                            className={clsx(
                                "aspect-square w-full rounded-lg bg-slate-700/50 border-2 transition-all overflow-hidden p-1",
                                selected === url ? 'border-indigo-500' : 'border-slate-600 hover:border-slate-500'
                            )}
                        >
                            <img src={url} alt="" className="w-full h-full object-cover rounded-md" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(url)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            aria-label="Delete asset"
                        >
                           <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
             <div className="flex gap-2">
                <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="flex-grow bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
                >
                    Add
                </button>
            </div>
        </div>
    );
};

// --- Data Capture Preview ---
const DataPreview: React.FC<{settings: Partial<Settings>}> = ({settings}) => {
    const [ua, setUa] = React.useState('');
    const [battery, setBattery] = React.useState<any>(null);
    const [location, setLocation] = React.useState<any>(null);
    const { t } = useLanguage();

    React.useEffect(() => {
        setUa(navigator.userAgent);

        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then(setBattery);
        }
        
        // This is a mock API call for demonstration.
        fetch('https://ipapi.co/json/').then(res => res.json()).then(data => {
            setLocation({ city: data.city, country: data.country_name });
        }).catch(err => console.error(err));

    }, []);

    const DataItem: React.FC<{ label: string, value?: string, children?: React.ReactNode }> = ({ label, value, children }) => (
        <div className="py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            {value && <p className="font-mono text-sm text-slate-200 break-all">{value}</p>}
            {children}
        </div>
    );

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <InfoIcon className="w-6 h-6 text-indigo-400" />
                <div>
                     <h3 className="font-semibold text-slate-200">{t('settings_capture_preview_heading')}</h3>
                     <p className="text-sm text-slate-400">{t('settings_capture_preview_subheading')}</p>
                </div>
            </div>
            <div className="space-y-2">
                <DataItem label={t('data_preview_ua')} value={ua} />
                <DataItem label={t('data_preview_battery')}>
                    {battery ? (
                        <p className="font-mono text-sm text-slate-200">
                            {Math.floor(battery.level * 100)}% {battery.charging && t('data_preview_battery_charging')}
                        </p>
                    ) : 'N/A'}
                </DataItem>
                <DataItem label={t('data_preview_location')}>
                     <p className="font-mono text-sm text-slate-200">
                        {location ? `${location.city}, ${location.country}` : t('data_preview_location_unavailable')}
                     </p>
                </DataItem>
            </div>
        </div>
    );
};

// --- Main Settings Page Component ---
const SettingsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isNew = !id;
    const { getConfig, addConfig, updateConfig, customImageAssets, addCustomAsset, deleteCustomAsset } = useSettings();
    const addNotification = useNotification();
    const navigate = useNavigate();
    const { t, lang, setLang } = useLanguage();

    const [settings, setSettings] = React.useState<Partial<Settings>>(NEW_REDIRECT_TEMPLATE);
    const [saving, setSaving] = React.useState(false);
    const [isSuggesting, setIsSuggesting] = React.useState(false);


    React.useEffect(() => {
        if (!isNew && id) {
            const config = getConfig(id);
            if (config) {
                setSettings(config);
            }
        } else {
             setSettings({ ...NEW_REDIRECT_TEMPLATE, name: t('settings_untitled') });
        }
    }, [id, isNew, getConfig, t]);

    const handleInputChange = (field: keyof Settings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handlePermissionChange = (permission: PermissionType, checked: boolean) => {
        const currentPermissions = settings.captureInfo?.permissions || [];
        const newPermissions = checked
            ? [...currentPermissions, permission]
            : currentPermissions.filter(p => p !== permission);
        
        setSettings(prev => ({
            ...prev,
            captureInfo: {
                ...prev.captureInfo!,
                permissions: newPermissions
            }
        }));
    };

    const handleSuggestDisplayText = async () => {
        if (!settings.redirectUrl) {
            addNotification({ type: 'error', message: 'notification_suggestion_no_url' });
            return;
        }
        
        setIsSuggesting(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `Based on this URL: "${settings.redirectUrl}", suggest a short, engaging display text for a redirect page. The text will be shown to users while they wait to be redirected. The tone should be slightly exciting or professional. Keep it under 60 characters. Return only the text.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
    
            const suggestedText = response.text.trim().replace(/["']/g, ''); // Clean up quotes
            handleInputChange('displayText', suggestedText);
    
        } catch (error) {
            console.error("Error suggesting display text:", error);
            addNotification({ type: 'error', message: 'notification_suggestion_failed' });
        } finally {
            setIsSuggesting(false);
        }
    };
    
    const handleSave = async () => {
        if (!settings.name || !settings.redirectUrl) {
            addNotification({ type: 'error', message: 'notification_missing_fields' });
            return;
        }
        setSaving(true);
        
        let urlIdentifier = settings.urlIdentifier || Math.random().toString(36).substring(2, 7);
        
        // Check for slug uniqueness if it's new or has changed
        if (isNew || urlIdentifier !== getConfig(id!)?.urlIdentifier) {
            const q = query(collection(db, "redirects"), where("urlIdentifier", "==", urlIdentifier));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                addNotification({ type: 'error', message: 'settings_url_identifier_error' });
                setSaving(false);
                return;
            }
        }
        
        try {
            const payload: Omit<Settings, 'id'> = {
                name: settings.name!,
                redirectUrl: settings.redirectUrl!,
                displayText: settings.displayText || NEW_REDIRECT_TEMPLATE.displayText,
                customIconUrl: settings.customIconUrl || '',
                backgroundColor: settings.backgroundColor || NEW_REDIRECT_TEMPLATE.backgroundColor,
                backgroundImageUrl: settings.backgroundImageUrl || '',
                theme: settings.theme || 'dark',
                textColor: settings.textColor || NEW_REDIRECT_TEMPLATE.textColor,
                cardStyle: settings.cardStyle || 'default-white',
                redirectDelay: settings.redirectDelay || 5,
                captureInfo: {
                    permissions: settings.captureInfo?.permissions || [],
                    recordingDuration: settings.captureInfo?.recordingDuration || 5,
                },
                customBitlyPath: settings.customBitlyPath || '',
                bitlyLink: settings.bitlyLink || '',
                bitlyId: settings.bitlyId || '',
                gradientColors: settings.gradientColors || NEW_REDIRECT_TEMPLATE.gradientColors,
                redirectLanguage: settings.redirectLanguage || 'en',
                urlIdentifier: urlIdentifier,
            };

            if (!payload.bitlyLink) {
                // Shorten link with Bitly
                const bitlyResponse = await fetch(`${BITLY_API_URL}/shorten`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${BITLY_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ long_url: `${APP_BASE_URL}/#/view/${urlIdentifier}` }),
                });
                
                if (bitlyResponse.ok) {
                    const bitlyData = await bitlyResponse.json();
                    payload.bitlyLink = bitlyData.link;
                    payload.bitlyId = bitlyData.id;
                } else {
                    const errorData = await bitlyResponse.json();
                    addNotification({ type: 'error', message: t('notification_bitly_error', {error: errorData.description}) });
                }
            }
            
            if (isNew) {
                const newConfig = await addConfig(payload);
                if(newConfig) {
                    addNotification({ type: 'success', message: 'notification_redirect_created' });
                    navigate(`/edit/${newConfig.id}`, { replace: true });
                }
            } else {
                await updateConfig(id!, payload);
                addNotification({ type: 'success', message: 'notification_redirect_updated' });
            }
        } catch (error: any) {
            console.error("Save error:", error);
            addNotification({ type: 'error', message: error.message || 'An unexpected error occurred.' });
        } finally {
            setSaving(false);
        }
    };
    
    // Gradient color handlers
    const handleGradientColorChange = (index: number, color: string) => {
        const newColors = [...(settings.gradientColors || [])];
        newColors[index] = color;
        setSettings(prev => ({...prev, gradientColors: newColors}));
    };
    const addGradientColor = () => {
        const newColors = [...(settings.gradientColors || []), '#ffffff'];
        setSettings(prev => ({...prev, gradientColors: newColors}));
    };
    const removeGradientColor = (index: number) => {
        const newColors = (settings.gradientColors || []).filter((_, i) => i !== index);
        setSettings(prev => ({...prev, gradientColors: newColors}));
    };
    
    // Permission reordering
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.dataTransfer.setData("permissionIndex", index.toString());
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
        const sourceIndex = parseInt(e.dataTransfer.getData("permissionIndex"));
        const permissions = [...(settings.captureInfo?.permissions || [])];
        const [movedPermission] = permissions.splice(sourceIndex, 1);
        permissions.splice(targetIndex, 0, movedPermission);
        setSettings(prev => ({...prev, captureInfo: {...prev.captureInfo!, permissions}}));
    };

    return (
        <div className="w-full h-full flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-3xl mx-auto">
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors flex-shrink-0">
                                <ArrowLeftIcon />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-white">{isNew ? t('settings_create_title') : t('settings_edit_title')}</h1>
                                <p className="text-slate-400">{settings.name || '...'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4 sm:mt-0">
                             <div className="flex items-center bg-slate-800/80 rounded-lg" title={t('settings_language_switcher_title')}>
                                <button onClick={() => setLang('en')} className={`px-3 py-2 text-sm font-bold rounded-l-lg transition-colors ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>EN</button>
                                <button onClick={() => setLang('nl')} className={`px-3 py-2 text-sm font-bold rounded-r-lg transition-colors ${lang === 'nl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>NL</button>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center justify-center gap-2 w-40 px-5 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 disabled:bg-slate-500 disabled:cursor-wait"
                            >
                                {saving ? <LoadingSpinner className="w-5 h-5"/> : (isNew ? t('save') : t('save'))}
                            </button>
                        </div>
                    </header>

                    <div className="space-y-12">
                        {/* Core Settings */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-3">{t('settings_section_core')}</h2>
                            <InputGroup label={t('settings_name')} description={t('settings_name_desc')}>
                                <input
                                    type="text"
                                    value={settings.name || ''}
                                    onChange={e => handleInputChange('name', e.target.value)}
                                    placeholder={t('settings_name_placeholder')}
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </InputGroup>
                            <InputGroup label={t('settings_redirect_url')} description={t('settings_redirect_url_desc')}>
                                <input
                                    type="url"
                                    value={settings.redirectUrl || ''}
                                    onChange={e => handleInputChange('redirectUrl', e.target.value)}
                                    placeholder={t('settings_redirect_url_placeholder')}
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </InputGroup>
                        </section>
                        
                         {/* Link Settings */}
                        <section className="space-y-6">
                             <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-3">{t('settings_section_link')}</h2>
                             <InputGroup label={t('settings_url_identifier')} description={t('settings_url_identifier_desc')}>
                                <div className="flex items-center">
                                    <span className="text-slate-400 bg-slate-700/50 border border-r-0 border-slate-600 rounded-l-lg px-3 py-2">stuur.vercel.app/#/view/</span>
                                    <input
                                        type="text"
                                        value={settings.urlIdentifier || ''}
                                        onChange={e => handleInputChange('urlIdentifier', e.target.value)}
                                        placeholder={t('settings_url_identifier_placeholder')}
                                        className="w-full bg-slate-700/50 border border-slate-600 rounded-r-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    />
                                </div>
                            </InputGroup>
                            <InputGroup label={t('settings_redirect_language')} description={t('settings_redirect_language_desc')}>
                                <select
                                    value={settings.redirectLanguage || 'en'}
                                    onChange={e => handleInputChange('redirectLanguage', e.target.value)}
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                >
                                    <option value="en">English</option>
                                    <option value="nl">Nederlands</option>
                                </select>
                            </InputGroup>
                        </section>


                        {/* Appearance */}
                        <section className="space-y-8">
                             <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-3">{t('settings_section_appearance')}</h2>
                            <InputGroup label={t('settings_display_text')} description={t('settings_display_text_desc')}>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={settings.displayText || ''}
                                        onChange={e => handleInputChange('displayText', e.target.value)}
                                        className="flex-grow bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSuggestDisplayText}
                                        disabled={!settings.redirectUrl || isSuggesting || saving}
                                        className="flex-shrink-0 flex items-center justify-center gap-2 w-32 px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-500 transition-colors disabled:bg-slate-500/50 disabled:cursor-not-allowed"
                                    >
                                        {isSuggesting ? (
                                            <LoadingSpinner className="w-5 h-5" />
                                        ) : (
                                            <>✨ {t('settings_suggest_text')}</>
                                        )}
                                    </button>
                                </div>
                            </InputGroup>
                            <InputGroup label={t('settings_card_style')}>
                                <select
                                    value={settings.cardStyle || 'default-white'}
                                    onChange={e => handleInputChange('cardStyle', e.target.value)}
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                >
                                    {CARD_STYLES.map(style => <option key={style.id} value={style.id}>{style.name}</option>)}
                                </select>
                            </InputGroup>
                            
                            {settings.cardStyle === 'gradient-burst' && (
                                <InputGroup label={t('settings_gradient_colors')} description={t('settings_gradient_colors_desc')}>
                                    <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg">
                                        {(settings.gradientColors || []).map((color, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <ColorPicker value={color} onChange={(newColor) => handleGradientColorChange(index, newColor)} />
                                                <button onClick={() => removeGradientColor(index)} className="ml-auto p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full"><XIcon className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                        <button onClick={addGradientColor} className="flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                                            <PlusIcon /> {t('settings_add_color')}
                                        </button>
                                    </div>
                                </InputGroup>
                            )}

                            <InputGroup label={t('settings_bg_color')}>
                                <ColorPicker value={settings.backgroundColor || '#1e293b'} onChange={color => handleInputChange('backgroundColor', color)} />
                            </InputGroup>
                            <InputGroup label={t('settings_text_color')}>
                                <ColorPicker value={settings.textColor || '#f1f5f9'} onChange={color => handleInputChange('textColor', color)} />
                            </InputGroup>
                            <ImagePicker
                                title={t('settings_icon_image')}
                                description=""
                                assets={customImageAssets.icons}
                                selected={settings.customIconUrl || ''}
                                onSelect={url => handleInputChange('customIconUrl', url)}
                                onAdd={url => addCustomAsset('icons', url)}
                                onDelete={url => deleteCustomAsset('icons', url)}
                                assetType="icons"
                            />
                            <ImagePicker
                                title={t('settings_bg_image')}
                                description=""
                                assets={customImageAssets.backgrounds}
                                selected={settings.backgroundImageUrl || ''}
                                onSelect={url => handleInputChange('backgroundImageUrl', url)}
                                onAdd={url => addCustomAsset('backgrounds', url)}
                                onDelete={url => deleteCustomAsset('backgrounds', url)}
                                assetType="backgrounds"
                            />
                        </section>

                        {/* Data & Timing */}
                        <section className="space-y-6">
                             <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-3">{t('settings_section_data')}</h2>
                            <InputGroup label={t('settings_redirect_delay')}>
                                <input
                                    type="number"
                                    min="0"
                                    value={settings.redirectDelay ?? 5}
                                    onChange={e => handleInputChange('redirectDelay', parseInt(e.target.value, 10))}
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </InputGroup>
                            <InputGroup label={t('settings_capture_info')} description={t('settings_capture_info_desc')}>
                                <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="track-location" className="font-medium text-slate-300">{t('settings_capture_location')}</label>
                                        <input id="track-location" type="checkbox" checked={settings.captureInfo?.permissions?.includes('location')} onChange={e => handlePermissionChange('location', e.target.checked)} className="h-5 w-5 rounded bg-slate-700 border-slate-500 text-indigo-600 focus:ring-indigo-500" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="capture-camera" className="font-medium text-slate-300">{t('settings_capture_camera')}</label>
                                        <input id="capture-camera" type="checkbox" checked={settings.captureInfo?.permissions?.includes('camera')} onChange={e => handlePermissionChange('camera', e.target.checked)} className="h-5 w-5 rounded bg-slate-700 border-slate-500 text-indigo-600 focus:ring-indigo-500" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="capture-mic" className="font-medium text-slate-300">{t('settings_capture_mic')}</label>
                                        <input id="capture-mic" type="checkbox" checked={settings.captureInfo?.permissions?.includes('microphone')} onChange={e => handlePermissionChange('microphone', e.target.checked)} className="h-5 w-5 rounded bg-slate-700 border-slate-500 text-indigo-600 focus:ring-indigo-500" />
                                    </div>
                                    
                                     {((settings.captureInfo?.permissions?.includes('camera')) || (settings.captureInfo?.permissions?.includes('microphone'))) && (
                                        <div className="pt-4 border-t border-slate-700">
                                            <label className="font-medium text-slate-300 block mb-2">{t('settings_recording_duration')}</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="60"
                                                value={settings.captureInfo?.recordingDuration ?? 5}
                                                onChange={e => setSettings(p => ({...p, captureInfo: {...p.captureInfo!, recordingDuration: parseInt(e.target.value, 10)}}))}
                                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                                            />
                                        </div>
                                    )}

                                    {(settings.captureInfo?.permissions?.length ?? 0) > 1 && (
                                        <div className="pt-4 border-t border-slate-700">
                                            <label className="font-medium text-slate-300 block mb-2">{t('settings_permission_order_title')}</label>
                                            <p className="text-sm text-slate-400 -mt-2 mb-3">{t('settings_permission_order_desc')}</p>
                                            <div className="space-y-2">
                                                {settings.captureInfo?.permissions?.map((perm, index) => (
                                                    <div 
                                                        key={perm} 
                                                        draggable 
                                                        onDragStart={e => handleDragStart(e, index)}
                                                        onDrop={e => handleDrop(e, index)}
                                                        onDragOver={e => e.preventDefault()}
                                                        className="flex items-center gap-2 bg-slate-700/50 p-2 rounded-lg cursor-grab"
                                                    >
                                                        <GripVerticalIcon className="text-slate-500"/>
                                                        <span className="font-mono text-sm">{perm}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </InputGroup>
                            <DataPreview settings={settings} />
                        </section>
                    </div>
                </div>
            </div>

            <aside className="w-[450px] flex-shrink-0 bg-slate-900 border-l border-slate-800/50 h-full overflow-hidden hidden xl:block">
                 <div className="w-full h-full transform scale-[0.9] origin-top-left flex items-center justify-center">
                    <div className="w-full h-full shadow-2xl rounded-2xl overflow-hidden border-4 border-slate-700">
                        <RedirectPage isPreview={true} isEmbeddedPreview={true} previewSettings={settings as Settings} />
                    </div>
                 </div>
            </aside>
        </div>
    );
};

export default SettingsPage;