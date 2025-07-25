import * as React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import type { Settings, CustomImageAssets, PermissionType, Language } from '../types';
import { useSettings, useNotification } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { NEW_REDIRECT_TEMPLATE, BITLY_API_TOKEN, BITLY_API_URL, CARD_STYLES, APP_BASE_URL, CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_UPLOAD_URL, CLOUDINARY_CLOUD_NAME } from '../constants';
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

const InputGroup: React.FC<{ label: string, description?: string, children: React.ReactNode, htmlFor?: string }> = ({ label, description, children, htmlFor }) => (
    <div className="space-y-2">
        <label htmlFor={htmlFor} className="font-semibold text-slate-200 block">{label}</label>
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
                    className={clsx(
                        'w-8 h-8 rounded-full shadow-lg border-2 transition-all',
                        value === color ? 'border-indigo-400 ring-2 ring-indigo-400' : 'border-slate-600'
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                />
            ))}
            <input 
              type="color" 
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              className="w-8 h-8 p-0 border-none rounded-full cursor-pointer bg-transparent"
              style={{'--color': value} as any}
            />
        </div>
    );
};

const ImageUploader: React.FC<{
    label: string,
    value: string,
    onChange: (url: string) => void,
    assetType: keyof CustomImageAssets
}> = ({ label, value, onChange, assetType }) => {
    const { customImageAssets, addCustomAsset } = useSettings();
    const [isUploading, setIsUploading] = React.useState(false);
    const addNotification = useNotification();
    const { t } = useLanguage();

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.secure_url) {
                onChange(data.secure_url);
                addCustomAsset(assetType, data.secure_url);
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error("Upload error:", error);
            addNotification({ type: 'error', message: 'Image upload failed.' });
        } finally {
            setIsUploading(false);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };
    
    return (
        <div>
            <p className="font-semibold text-slate-200 block mb-2">{label}</p>
            <div className="flex flex-wrap gap-2 mb-2">
                <button type="button" onClick={() => onChange('')} className={clsx("h-16 w-16 rounded-lg border-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors", !value ? 'border-indigo-500' : 'border-slate-600')}>None</button>
                {customImageAssets[assetType].map(url => (
                    <button type="button" key={url} onClick={() => onChange(url)} className={clsx("h-16 w-16 rounded-lg border-2 overflow-hidden", value === url ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-600')}>
                        <img src={url} alt="" className="w-full h-full object-cover"/>
                    </button>
                ))}
            </div>
            <label onDragOver={e => e.preventDefault()} onDrop={onDrop} className="relative mt-2 flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md cursor-pointer hover:border-indigo-500 transition-colors">
                <input id={`${assetType}-upload`} type="file" className="sr-only" onChange={onFileChange} accept="image/png, image/jpeg, image/gif, image/webp" />
                <div className="space-y-1 text-center">
                    {isUploading ? <LoadingSpinner className="mx-auto h-12 w-12 text-slate-400"/> : <UploadCloudIcon className="mx-auto h-12 w-12 text-slate-400"/>}
                    <div className="flex text-sm text-slate-400">
                        <p className="pl-1">{t('settings_upload_prompt')}</p>
                    </div>
                    <p className="text-xs text-slate-500">{t('settings_upload_types')}</p>
                </div>
            </label>
        </div>
    );
};

const PermissionOrderer: React.FC<{
    permissions: PermissionType[],
    onChange: (permissions: PermissionType[]) => void
}> = ({ permissions, onChange }) => {
    const { t } = useLanguage();
    const [draggedItem, setDraggedItem] = React.useState<PermissionType | null>(null);

    const onDragStart = (e: React.DragEvent<HTMLDivElement>, item: PermissionType) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>, targetItem: PermissionType) => {
        if (!draggedItem) return;

        const currentIndex = permissions.indexOf(draggedItem);
        const targetIndex = permissions.indexOf(targetItem);

        const newPermissions = [...permissions];
        newPermissions.splice(currentIndex, 1);
        newPermissions.splice(targetIndex, 0, draggedItem);
        
        onChange(newPermissions);
        setDraggedItem(null);
    };
    
    const permissionLabels: Record<PermissionType, string> = {
        location: t('settings_capture_location'),
        camera: t('settings_capture_camera'),
        microphone: t('settings_capture_mic'),
    };

    return (
        <div>
            <p className="font-semibold text-slate-200 block mb-2">{t('settings_permission_order_title')}</p>
            <div className="space-y-2 rounded-lg bg-slate-900/50 p-2">
                {permissions.length > 0 ? permissions.map(p => (
                    <div 
                        key={p} 
                        draggable 
                        onDragStart={e => onDragStart(e, p)}
                        onDragOver={onDragOver}
                        onDrop={e => onDrop(e, p)}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-md cursor-grab active:cursor-grabbing"
                    >
                        <span className="font-medium text-slate-300">{permissionLabels[p]}</span>
                        <GripVerticalIcon className="w-5 h-5 text-slate-400"/>
                    </div>
                )) : <p className="text-sm text-slate-400 text-center p-4">{t('settings_permission_order_desc')}</p>}
            </div>
        </div>
    );
};

// --- Main Settings Page Component ---

const SettingsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, lang, setLang } = useLanguage();
    const { getConfig, addConfig, updateConfig, customImageAssets, addCustomAsset } = useSettings();
    const addNotification = useNotification();

    const [settings, setSettings] = React.useState<Omit<Settings, 'id' | 'bitlyId' | 'bitlyLink'> & { id?: string }>(() => ({
        ...NEW_REDIRECT_TEMPLATE,
        name: t('settings_untitled')
    }));
    const [isNew, setIsNew] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    
    React.useEffect(() => {
        if (id) {
            const config = getConfig(id);
            if (config) {
                setSettings(config);
                setIsNew(false);
            }
        } else {
            setIsNew(true);
            setSettings({
                ...NEW_REDIRECT_TEMPLATE,
                name: t('settings_untitled'),
                urlIdentifier: `new-${Math.random().toString(36).substring(2, 7)}` // Temp unique ID
            });
        }
    }, [id, getConfig, t]);

    const handleChange = <K extends keyof Settings>(field: K, value: Settings[K]) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };
    
    const handleCapturePermissionToggle = (permission: PermissionType) => {
        const currentPermissions = settings.captureInfo.permissions;
        const newPermissions = currentPermissions.includes(permission)
            ? currentPermissions.filter(p => p !== permission)
            : [...currentPermissions, permission];
        
        handleChange('captureInfo', { ...settings.captureInfo, permissions: newPermissions });
    };

    const generateRandomString = (length: number) => {
        return Math.random().toString(36).substring(2, 2 + length);
    }
    
    const handleSave = async () => {
        if (!settings.name || !settings.redirectUrl) {
            addNotification({ type: 'error', message: 'notification_missing_fields' });
            return;
        }
        setIsSaving(true);
        
        // Ensure URL identifier is unique if provided, or generate one
        let finalIdentifier = settings.urlIdentifier || generateRandomString(5);
        if (settings.urlIdentifier) {
            const q = query(collection(db, "redirects"), where("urlIdentifier", "==", settings.urlIdentifier));
            const querySnapshot = await getDocs(q);
            const isTaken = querySnapshot.docs.some(doc => doc.id !== id);
            if(isTaken) {
                addNotification({type: 'error', message: 'settings_url_identifier_error'});
                setIsSaving(false);
                return;
            }
        }

        const settingsToSave = { ...settings, urlIdentifier: finalIdentifier };

        let bitlyData: { bitlyLink?: string, bitlyId?: string } = {};
        try {
            const bitlyResponse = await fetch(`${BITLY_API_URL}/shorten`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${BITLY_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ long_url: `${APP_BASE_URL}/#/view/${finalIdentifier}` }),
            });
            if (bitlyResponse.ok) {
                const data = await bitlyResponse.json();
                bitlyData = { bitlyLink: data.link, bitlyId: data.id };
            } else {
                const errorData = await bitlyResponse.json();
                addNotification({type: 'error', message: `notification_bitly_error,{error:${errorData.description}}`});
            }
        } catch (e) {
            console.error(e);
            addNotification({type: 'error', message: `notification_bitly_error,{error:e.message}`});
        }

        const finalSettings = { ...settingsToSave, ...bitlyData };

        if (isNew) {
            const newConfig = await addConfig(finalSettings);
            if (newConfig) {
                addNotification({ type: 'success', message: 'notification_redirect_created' });
                navigate(`/edit/${newConfig.id}`);
            }
        } else if (id) {
            await updateConfig(id, finalSettings);
            setSettings(s => ({ ...s, ...bitlyData }));
            addNotification({ type: 'success', message: 'notification_redirect_updated' });
        }
        setIsSaving(false);
    };
    
    const FormSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-6">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {children}
        </div>
    );

    return (
        <div className="w-full h-screen flex flex-col dark">
            <header className="flex-shrink-0 bg-slate-900 border-b border-slate-700/50 px-6 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"><ArrowLeftIcon /></Link>
                    <div>
                        <h1 className="text-xl font-bold text-white">{isNew ? t('settings_create_title') : t('settings_edit_title')}</h1>
                        <p className="text-sm text-slate-400">{settings.name}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-700/50 rounded-lg">
                        <button onClick={() => setLang('en')} className={`px-3 py-2 text-xs font-bold rounded-l-lg transition-colors ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>EN</button>
                        <button onClick={() => setLang('nl')} className={`px-3 py-2 text-xs font-bold rounded-r-lg transition-colors ${lang === 'nl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>NL</button>
                    </div>
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-wait">
                        {isSaving ? <><LoadingSpinner className="w-5 h-5"/> {t('saving')}</> : t('save')}
                    </button>
                </div>
            </header>
            <div className="flex-grow flex w-full h-full overflow-hidden">
                <aside className="w-1/2 max-w-2xl h-full overflow-y-auto p-8 space-y-6 bg-slate-900 border-r border-slate-700/50 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
                    <FormSection title={t('settings_section_core')}>
                        <InputGroup label={t('settings_name')} description={t('settings_name_desc')} htmlFor="name">
                            <input id="name" type="text" value={settings.name} onChange={e => handleChange('name', e.target.value)} placeholder={t('settings_name_placeholder')} className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                        </InputGroup>
                        <InputGroup label={t('settings_redirect_url')} description={t('settings_redirect_url_desc')} htmlFor="redirectUrl">
                            <input id="redirectUrl" type="url" value={settings.redirectUrl} onChange={e => handleChange('redirectUrl', e.target.value)} placeholder={t('settings_redirect_url_placeholder')} className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                        </InputGroup>
                    </FormSection>

                    <FormSection title={t('settings_section_link')}>
                        <InputGroup label={t('settings_url_identifier')} description={t('settings_url_identifier_desc')} htmlFor="urlIdentifier">
                             <div className="flex items-center">
                                <span className="px-3 py-2 bg-slate-700 text-slate-400 border border-r-0 border-slate-600 rounded-l-md">{`${APP_BASE_URL}/#/view/`}</span>
                                <input id="urlIdentifier" type="text" value={settings.urlIdentifier} onChange={e => handleChange('urlIdentifier', e.target.value)} placeholder={t('settings_url_identifier_placeholder')} className="w-full p-2 bg-slate-700 rounded-r-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                            </div>
                        </InputGroup>
                        <InputGroup label={t('settings_redirect_language')} description={t('settings_redirect_language_desc')} htmlFor="redirectLanguage">
                            <select id="redirectLanguage" value={settings.redirectLanguage} onChange={e => handleChange('redirectLanguage', e.target.value as Language)} className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none">
                                <option value="en">English</option>
                                <option value="nl">Nederlands (Dutch)</option>
                            </select>
                        </InputGroup>
                    </FormSection>

                     <FormSection title={t('settings_section_appearance')}>
                        <InputGroup label={t('settings_display_text')} description={t('settings_display_text_desc')} htmlFor="displayText">
                           <input id="displayText" type="text" value={settings.displayText} onChange={e => handleChange('displayText', e.target.value)} className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                        </InputGroup>
                        <InputGroup label={t('settings_card_style')} htmlFor="cardStyle">
                            <select id="cardStyle" value={settings.cardStyle} onChange={e => handleChange('cardStyle', e.target.value)} className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none">
                                {CARD_STYLES.map(style => <option key={style.id} value={style.id}>{style.name}</option>)}
                            </select>
                        </InputGroup>
                        <InputGroup label={t('settings_bg_color')}>
                            <ColorPicker value={settings.backgroundColor} onChange={color => handleChange('backgroundColor', color)} />
                        </InputGroup>
                        <InputGroup label={t('settings_text_color')}>
                            <ColorPicker value={settings.textColor} onChange={color => handleChange('textColor', color)} />
                        </InputGroup>
                        <ImageUploader label={t('settings_icon_image')} value={settings.customIconUrl} onChange={url => handleChange('customIconUrl', url)} assetType="icons" />
                        <ImageUploader label={t('settings_bg_image')} value={settings.backgroundImageUrl} onChange={url => handleChange('backgroundImageUrl', url)} assetType="backgrounds" />
                        
                        {settings.cardStyle === 'gradient-burst' && (
                            <InputGroup label={t('settings_gradient_colors')} description={t('settings_gradient_colors_desc')}>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {settings.gradientColors.map((color, index) => (
                                        <div key={index} className="relative">
                                            <input type="color" value={color} onChange={e => {
                                                const newColors = [...settings.gradientColors];
                                                newColors[index] = e.target.value;
                                                handleChange('gradientColors', newColors);
                                            }} className="w-10 h-10 p-0 border-none rounded-full cursor-pointer bg-transparent"/>
                                            <button onClick={() => handleChange('gradientColors', settings.gradientColors.filter((_, i) => i !== index))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><XIcon className="w-3 h-3"/></button>
                                        </div>
                                    ))}
                                    <button onClick={() => handleChange('gradientColors', [...settings.gradientColors, '#ffffff'])} className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-dashed border-slate-500 text-slate-500 hover:border-white hover:text-white transition">
                                        <PlusIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </InputGroup>
                        )}
                    </FormSection>
                    
                    <FormSection title={t('settings_section_data')}>
                        <InputGroup label={t('settings_redirect_delay')} htmlFor="redirectDelay">
                            <input id="redirectDelay" type="number" min="0" value={settings.redirectDelay} onChange={e => handleChange('redirectDelay', parseInt(e.target.value, 10))} className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                        </InputGroup>
                        <InputGroup label={t('settings_capture_info')} description={t('settings_capture_info_desc')}>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-md cursor-pointer hover:bg-slate-700/80">
                                    <input type="checkbox" checked={settings.captureInfo.permissions.includes('location')} onChange={() => handleCapturePermissionToggle('location')} className="w-5 h-5 rounded text-indigo-500 bg-slate-800 border-slate-600 focus:ring-indigo-600" />
                                    <span className="font-medium text-slate-300">{t('settings_capture_location')}</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-md cursor-pointer hover:bg-slate-700/80">
                                    <input type="checkbox" checked={settings.captureInfo.permissions.includes('camera')} onChange={() => handleCapturePermissionToggle('camera')} className="w-5 h-5 rounded text-indigo-500 bg-slate-800 border-slate-600 focus:ring-indigo-600" />
                                    <span className="font-medium text-slate-300">{t('settings_capture_camera')}</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-md cursor-pointer hover:bg-slate-700/80">
                                    <input type="checkbox" checked={settings.captureInfo.permissions.includes('microphone')} onChange={() => handleCapturePermissionToggle('microphone')} className="w-5 h-5 rounded text-indigo-500 bg-slate-800 border-slate-600 focus:ring-indigo-600" />
                                    <span className="font-medium text-slate-300">{t('settings_capture_mic')}</span>
                                </label>
                            </div>
                        </InputGroup>
                        {settings.captureInfo.permissions.length > 0 && (
                            <>
                                <PermissionOrderer permissions={settings.captureInfo.permissions} onChange={p => handleChange('captureInfo', {...settings.captureInfo, permissions: p})} />
                                <InputGroup label={t('settings_recording_duration')} htmlFor="recordingDuration">
                                    <input id="recordingDuration" type="number" min="1" value={settings.captureInfo.recordingDuration} onChange={e => handleChange('captureInfo', {...settings.captureInfo, recordingDuration: parseInt(e.target.value, 10)})} className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                                </InputGroup>
                            </>
                        )}
                    </FormSection>
                </aside>

                <main className="w-1/2 flex-grow h-full bg-slate-800">
                     <div className="w-full h-full relative transform scale-[0.9] origin-center bg-dots">
                        <RedirectPage 
                            key={JSON.stringify(settings)}
                            previewSettings={settings}
                            isPreview={true}
                            isEmbeddedPreview={true}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;
