import * as React from 'react';
import { Link, useParams, useHistory } from 'react-router-dom';
import clsx from 'clsx';
import type { Settings, PermissionType } from '../types';
import { useSettings, useNotification } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { NEW_REDIRECT_TEMPLATE, CARD_STYLES } from '../constants';

// --- Re-usable UI Components ---

const ArrowLeftIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>);
const LoadingSpinner: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);

const Input = (props: React.ComponentProps<'input'>) => (
    <input {...props} className={clsx("w-full p-3 bg-slate-800 rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition", props.className)} />
);

const Select = (props: React.ComponentProps<'select'>) => (
    <select {...props} className={clsx("w-full p-3 bg-slate-800 rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition", props.className)} />
);

const InputGroup: React.FC<{ label: string, description?: string, children: React.ReactNode, htmlFor?: string }> = ({ label, description, children, htmlFor }) => (
    <div className="space-y-2">
        <label htmlFor={htmlFor} className="font-semibold text-slate-200 block">{label}</label>
        {children}
        {description && <p className="text-sm text-slate-400">{description}</p>}
    </div>
);


const SettingsPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const history = useHistory();
    const { addConfig, updateConfig, getConfig } = useSettings();
    const addNotification = useNotification();
    const { t } = useLanguage();

    const isNew = !id;
    const [settings, setSettings] = React.useState<Partial<Settings>>(
        isNew ? { ...NEW_REDIRECT_TEMPLATE, name: t('settings_untitled') } : {}
    );
    const [loading, setLoading] = React.useState(!isNew);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (id) {
            const config = getConfig(id);
            if (config) {
                setSettings(config);
                setLoading(false);
            } else {
                // If config is not in context, it might be a direct link access.
                // In a more robust app, you would fetch from DB here.
                // For now, we'll rely on context pre-loading.
                console.error("Config not found");
                addNotification({ type: 'error', message: 'Redirect not found.' });
                history.push('/');
            }
        }
    }, [id, getConfig, history, addNotification]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    };
    
    const handlePermissionChange = (permission: PermissionType) => {
        setSettings(prev => {
            const currentPermissions = prev.captureInfo?.permissions || [];
            const newPermissions = currentPermissions.includes(permission)
                ? currentPermissions.filter(p => p !== permission)
                : [...currentPermissions, permission];
            const currentCaptureInfo = prev.captureInfo || NEW_REDIRECT_TEMPLATE.captureInfo;
            return {
                ...prev,
                captureInfo: {
                    ...currentCaptureInfo,
                    permissions: newPermissions,
                }
            };
        });
    };

    const handleSave = async () => {
        if (!settings.name || !settings.redirectUrl) {
            addNotification({ type: 'error', message: t('notification_missing_fields') });
            return;
        }
        setIsSaving(true);
        try {
            if (isNew) {
                await addConfig(settings as Omit<Settings, 'id'>);
                addNotification({ type: 'success', message: t('notification_redirect_created') });
            } else if(id) {
                await updateConfig(id, settings);
                addNotification({ type: 'success', message: t('notification_redirect_updated') });
            }
            history.push('/');
        } catch (error) {
            console.error(error);
             addNotification({ type: 'error', message: t('notification_redirect_save_failed') });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return <div className="w-full h-full flex justify-center items-center"><LoadingSpinner className="w-8 h-8 text-indigo-400"/></div>
    }

    return (
        <div className="w-full h-full text-slate-300 p-4 sm:p-6 lg:p-8 overflow-y-auto dark">
            <div className="max-w-3xl mx-auto">
                 <header className="flex items-center gap-4 mb-8">
                     <Link to="/" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors flex-shrink-0">
                        <ArrowLeftIcon />
                     </Link>
                     <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">
                            {isNew ? t('settings_create_title') : t('settings_edit_title')}
                        </h1>
                     </div>
                </header>

                <main className="space-y-8">
                     <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-6">
                        <h2 className="text-xl font-bold text-white">{t('settings_section_core')}</h2>
                        <InputGroup label={t('settings_name')} description={t('settings_name_desc')} htmlFor="name">
                            <Input id="name" name="name" value={settings.name || ''} onChange={handleChange} placeholder={t('settings_name_placeholder')} />
                        </InputGroup>
                         <InputGroup label={t('settings_redirect_url')} description={t('settings_redirect_url_desc')} htmlFor="redirectUrl">
                            <Input id="redirectUrl" name="redirectUrl" type="url" value={settings.redirectUrl || ''} onChange={handleChange} placeholder={t('settings_redirect_url_placeholder')} />
                        </InputGroup>
                    </section>

                    <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-6">
                        <h2 className="text-xl font-bold text-white">{t('settings_section_appearance')}</h2>
                        <InputGroup label={t('settings_display_text')} description={t('settings_display_text_desc')} htmlFor="displayText">
                            <Input id="displayText" name="displayText" value={settings.displayText || ''} onChange={handleChange} />
                        </InputGroup>
                        <InputGroup label={t('settings_icon_image')} htmlFor="customIconUrl">
                            <Input id="customIconUrl" name="customIconUrl" type="url" value={settings.customIconUrl || ''} onChange={handleChange} placeholder="https://.../icon.png" />
                        </InputGroup>
                         <InputGroup label={t('settings_bg_image')} htmlFor="backgroundImageUrl">
                            <Input id="backgroundImageUrl" name="backgroundImageUrl" type="url" value={settings.backgroundImageUrl || ''} onChange={handleChange} placeholder="https://.../background.jpg" />
                        </InputGroup>
                         <InputGroup label={t('settings_card_style')} htmlFor="cardStyle">
                             <Select id="cardStyle" name="cardStyle" value={settings.cardStyle || 'default-white'} onChange={handleChange}>
                                 {CARD_STYLES.map(style => <option key={style.id} value={style.id}>{style.name}</option>)}
                             </Select>
                         </InputGroup>
                         <InputGroup label={t('settings_bg_color')} htmlFor="backgroundColor">
                            <Input id="backgroundColor" name="backgroundColor" type="color" value={settings.backgroundColor || '#1e293b'} onChange={handleChange} className="p-1 h-10"/>
                         </InputGroup>
                         <InputGroup label={t('settings_text_color')} htmlFor="textColor">
                            <Input id="textColor" name="textColor" type="color" value={settings.textColor || '#f1f5f9'} onChange={handleChange} className="p-1 h-10"/>
                         </InputGroup>
                    </section>

                    <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-6">
                        <h2 className="text-xl font-bold text-white">{t('settings_section_data')}</h2>
                        <InputGroup label={t('settings_redirect_delay')} htmlFor="redirectDelay">
                            <Input id="redirectDelay" name="redirectDelay" type="number" value={settings.redirectDelay || 5} onChange={handleNumericChange} min="0" />
                        </InputGroup>
                         <InputGroup label={t('settings_capture_info')} description={t('settings_capture_info_desc')}>
                             <div className="space-y-2">
                                 {(['location', 'camera', 'microphone'] as PermissionType[]).map(p => (
                                     <label key={p} className="flex items-center gap-3 cursor-pointer">
                                         <input type="checkbox" checked={settings.captureInfo?.permissions?.includes(p) || false} onChange={() => handlePermissionChange(p)} className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-600" />
                                         <span>{t(`settings_capture_${p === 'microphone' ? 'mic' : p}` as any)}</span>
                                     </label>
                                 ))}
                             </div>
                         </InputGroup>
                        {(settings.captureInfo?.permissions?.length || 0) > 0 && (
                            <InputGroup label={t('settings_recording_duration')} htmlFor="recordingDuration">
                                <Input 
                                    id="recordingDuration" 
                                    name="recordingDuration" 
                                    type="number" 
                                    value={settings.captureInfo?.recordingDuration || 5} 
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value, 10) || 0;
                                        setSettings(p => {
                                            const currentCaptureInfo = p.captureInfo || NEW_REDIRECT_TEMPLATE.captureInfo;
                                            return {
                                                ...p,
                                                captureInfo: {
                                                    ...currentCaptureInfo,
                                                    recordingDuration: value
                                                }
                                            };
                                        });
                                    }}
                                    min="1" 
                                />
                            </InputGroup>
                        )}
                    </section>
                </main>

                <footer className="mt-8 flex justify-end gap-4">
                     <button onClick={() => history.push('/')} className="px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition-colors">
                        Cancel
                     </button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-2">
                        {isSaving && <LoadingSpinner className="w-5 h-5" />}
                        {isSaving ? t('saving') : t('save')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SettingsPage;