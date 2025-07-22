import * as React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import type { Settings, CustomImageAssets } from '../types';
import { useSettings, useNotification } from '../contexts/SettingsContext';
import { NEW_REDIRECT_TEMPLATE, BITLY_API_TOKEN, BITLY_API_URL, CARD_STYLES } from '../constants';
import RedirectPage from './RedirectPage';

// --- Re-usable UI Components ---

const ArrowLeftIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>);
const LoadingSpinner: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);
const InfoIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>);
const ImagePlusIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" y1="5" x2="22" y2="5"/><line x1="19" y1="2" x2="19" y2="8"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>);
const XIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const SparklesIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.5 3L7 7.5l3 1.5L12 12l1.5-3L17 7.5l-3-1.5z"/><path d="M5 21v-4"/><path d="M19 21v-4"/><path d="m5 10-2-2"/><path d="m19 10 2-2"/><path d="m2 17 2-2"/><path d="M22 17l-2-2"/></svg>);


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

// --- Data Capture and Map Components ---

const MapUpdater: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
};

const DataCapturePreview: React.FC = () => {
    const [location, setLocation] = React.useState<{lat: number, lon: number} | null>(null);
    const [address, setAddress] = React.useState<string | null>(null);
    const [isFetchingAddress, setIsFetchingAddress] = React.useState(false);
    const [battery, setBattery] = React.useState<{level: number, charging: boolean} | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const userAgent = navigator.userAgent;

    React.useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                setLocation(newLocation);
                setIsFetchingAddress(true);
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLocation.lat}&lon=${newLocation.lon}`)
                    .then(res => res.json())
                    .then(data => setAddress(data.display_name || 'Address not found.'))
                    .catch(() => setAddress('Could not fetch address.'))
                    .finally(() => setIsFetchingAddress(false));
            },
            (err) => setError(`Location Error: ${err.message}`)
        );

        if ('getBattery' in navigator && typeof (navigator as any).getBattery === 'function') {
            (navigator as any).getBattery().then((bat: any) => {
                setBattery({ level: Math.round(bat.level * 100), charging: bat.charging });
            });
        }
    }, []);

    const renderItem = (label: string, value: React.ReactNode) => (
        <div className="flex justify-between items-center text-sm py-2 border-b border-slate-700/50 last:border-b-0">
            <dt className="font-medium text-slate-300">{label}</dt>
            <dd className="text-slate-400 font-mono text-right truncate">{value}</dd>
        </div>
    );
    
    if (error) {
        return <div className="text-red-400 text-sm p-4 bg-red-900/20 rounded-lg">{error}</div>;
    }

    return (
        <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
                 <dl>
                    {renderItem('User Agent', <span className="max-w-[200px] truncate block">{userAgent}</span>)}
                    {renderItem('Battery', battery ? `${battery.level}% ${battery.charging ? '(Charging)' : ''}` : 'N/A')}
                    {renderItem('Approx. Location', isFetchingAddress ? 'Fetching...' : (address ?? 'Unavailable'))}
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

const SettingsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getConfig, addConfig, updateConfig, customImageAssets, addCustomAsset, deleteCustomAsset } = useSettings();
    const addNotification = useNotification();
    
    const [settings, setSettings] = React.useState<Omit<Settings, 'id'> | Settings>(() => {
        if (id) {
            const existingConfig = getConfig(id);
            if (existingConfig) return existingConfig;
        }
        return { name: '', ...NEW_REDIRECT_TEMPLATE };
    });
    
    const [isSaving, setIsSaving] = React.useState(false);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [aiPrompt, setAiPrompt] = React.useState('');
    const [newAssetUrl, setNewAssetUrl] = React.useState({ icons: '', backgrounds: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setSettings(prev => ({...prev, [name]: Number(value)}));
        } else {
            setSettings(prev => ({...prev, [name]: value}));
        }
    };

    const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            captureInfo: { ...prev.captureInfo, [name]: checked }
        }));
    };

    const handleAddNewAsset = (type: keyof CustomImageAssets) => {
        const url = newAssetUrl[type].trim();
        if (url) {
            addCustomAsset(type, url);
            setNewAssetUrl(prev => ({ ...prev, [type]: ''}));
        }
    };
    
    const createOrUpdateBitlyLink = async (): Promise<{bitlyLink?: string, bitlyId?: string}> => {
        if (!settings.redirectUrl) return {};
        
        const longUrl = settings.redirectUrl.startsWith('http') ? settings.redirectUrl : `https://${settings.redirectUrl}`;
        const body: {long_url: string} = { long_url: longUrl };

        try {
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
            addNotification({ type: 'error', message: `Bitly Error: ${error.message}` });
            return {};
        }
    };

    const handleSave = async () => {
        if (!settings.name || !settings.redirectUrl) {
            addNotification({ type: 'error', message: 'Please provide a Name and Redirect URL.' });
            return;
        }
        setIsSaving(true);
        
        let linkData: {bitlyLink?: string, bitlyId?: string} = { bitlyLink: settings.bitlyLink, bitlyId: settings.bitlyId };
        
        const existingConfig = id ? getConfig(id) : undefined;
        const urlChanged = existingConfig?.redirectUrl !== settings.redirectUrl;

        if (!settings.bitlyLink || urlChanged) {
            linkData = await createOrUpdateBitlyLink();
        }
        
        const finalSettings = {...settings, ...linkData};
        
        if (id) {
            updateConfig(id, finalSettings);
            addNotification({ type: 'success', message: 'Redirect updated successfully!' });
        } else {
            addConfig(finalSettings);
            addNotification({ type: 'success', message: 'Redirect created successfully!' });
        }
        
        setIsSaving(false);
        navigate('/');
    };

    const handleGenerateWithAI = async () => {
        if (!aiPrompt) {
            addNotification({ type: 'info', message: 'Please enter a description for the AI.' });
            return;
        }
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Based on the following description, generate a design for a redirect page. Description: "${aiPrompt}". Provide a theme name, a suitable card style, text color, and background color.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            displayText: { type: Type.STRING, description: "A short, engaging display text for the user."},
                            textColor: { type: Type.STRING, description: "A hex color code for the main text." },
                            backgroundColor: { type: Type.STRING, description: "A hex color code for the background." },
                            cardStyle: { type: Type.STRING, description: `One of the following values: ${CARD_STYLES.map(s => s.id).join(', ')}`},
                        },
                        required: ["displayText", "textColor", "backgroundColor", "cardStyle"]
                    }
                }
            });

            const jsonString = response.text;
            if (!jsonString) {
                throw new Error("AI returned an empty response.");
            }
            const generated = JSON.parse(jsonString);
            
            setSettings(prev => ({ ...prev, ...generated }));
            addNotification({ type: 'success', message: 'AI design applied!' });

        } catch (error) {
            console.error('AI Generation Error:', error);
            addNotification({ type: 'error', message: 'Failed to generate design with AI.' });
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <div className="w-full h-full flex flex-col dark overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 p-4 flex justify-between items-center z-20">
                <div className="flex items-center gap-4">
                     <Link to="/" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                        <ArrowLeftIcon />
                     </Link>
                     <div>
                         <h1 className="text-xl font-bold text-white">{id ? 'Edit Redirect' : 'Create New Redirect'}</h1>
                         <p className="text-sm text-slate-400">{settings.name || 'Untitled Redirect'}</p>
                     </div>
                </div>
                <button onClick={handleSave} disabled={isSaving || isGenerating} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-2">
                    {isSaving ? <LoadingSpinner className="w-5 h-5"/> : null}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </header>
            
            <div className="flex-grow flex w-full overflow-hidden">
                {/* Settings Panel */}
                <aside className="w-full lg:w-1/2 xl:w-[40%] flex-shrink-0 p-6 space-y-6 overflow-y-auto">
                    <Section title="Core Settings">
                        <InputGroup label="Name" description="A memorable name for your redirect.">
                            <input type="text" name="name" value={settings.name} onChange={handleChange} className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="e.g., My Portfolio Link" />
                        </InputGroup>
                        <InputGroup label="Redirect URL" description="The final destination URL where users will be sent.">
                            <input type="url" name="redirectUrl" value={settings.redirectUrl} onChange={handleChange} className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="https://example.com" />
                        </InputGroup>
                        <InputGroup label="Custom Bitly Path (Premium)" description="This feature requires a premium Bitly account and is currently disabled.">
                            <div className="flex items-center">
                               <span className="px-3 py-3 bg-slate-800 text-slate-400 border border-r-0 border-slate-600 rounded-l-lg">bit.ly/</span>
                               <input type="text" name="customBitlyPath" value={settings.customBitlyPath ?? ''} onChange={handleChange} className="w-full p-3 bg-slate-700 rounded-r-lg border border-slate-600 outline-none transition disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed" placeholder="Premium feature" disabled />
                            </div>
                        </InputGroup>
                    </Section>
                    
                     <Section title="AI Design Assistant">
                        <InputGroup label="Describe your desired style" description="Let AI help you design. Try 'a retro 80s computer theme' or 'a clean, professional look for a tech startup'.">
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                placeholder="e.g., A futuristic neon theme for a gaming site"
                                rows={3}
                            />
                        </InputGroup>
                        <button onClick={handleGenerateWithAI} disabled={isGenerating || isSaving} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-400 transition-colors disabled:opacity-50">
                            {isGenerating ? <LoadingSpinner className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5"/>}
                            {isGenerating ? 'Generating...' : 'Generate with AI'}
                        </button>
                    </Section>
                    
                    <Section title="Appearance">
                         <InputGroup label="Display Text" description="The main text shown on the redirect page.">
                            <input type="text" name="displayText" value={settings.displayText} onChange={handleChange} className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
                        </InputGroup>
                         <InputGroup label="Card Style">
                            <select name="cardStyle" value={settings.cardStyle} onChange={handleChange} className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
                                {CARD_STYLES.map(style => <option key={style.id} value={style.id}>{style.name}</option>)}
                            </select>
                        </InputGroup>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <InputGroup label="Background Color">
                               <ColorPicker value={settings.backgroundColor} onChange={color => setSettings(p => ({...p, backgroundColor: color}))} />
                           </InputGroup>
                           <InputGroup label="Text Color">
                               <ColorPicker value={settings.textColor} onChange={color => setSettings(p => ({...p, textColor: color}))} />
                           </InputGroup>
                        </div>
                        <InputGroup label="Icon Image URL">
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                               {customImageAssets.icons.map(url => <AssetButton key={url} assetUrl={url} onClick={() => setSettings(p => ({...p, customIconUrl: url}))} isSelected={settings.customIconUrl === url} onDelete={() => deleteCustomAsset('icons', url)}/>)}
                            </div>
                            <div className="flex gap-2">
                                <input type="url" value={newAssetUrl.icons} onChange={e => setNewAssetUrl(p => ({...p, icons: e.target.value}))} className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 outline-none transition" placeholder="https://path.to/your/icon.png" />
                                <button onClick={() => handleAddNewAsset('icons')} className="p-3 bg-slate-600 rounded-lg hover:bg-slate-500"><ImagePlusIcon/></button>
                            </div>
                         </InputGroup>
                         <InputGroup label="Background Image URL">
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                               {customImageAssets.backgrounds.map(url => <AssetButton key={url} assetUrl={url} onClick={() => setSettings(p => ({...p, backgroundImageUrl: url}))} isSelected={settings.backgroundImageUrl === url} onDelete={() => deleteCustomAsset('backgrounds', url)}/>)}
                            </div>
                            <div className="flex gap-2">
                                <input type="url" value={newAssetUrl.backgrounds} onChange={e => setNewAssetUrl(p => ({...p, backgrounds: e.target.value}))} className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 outline-none transition" placeholder="https://path.to/your/background.jpg" />
                                <button onClick={() => handleAddNewAsset('backgrounds')} className="p-3 bg-slate-600 rounded-lg hover:bg-slate-500"><ImagePlusIcon/></button>
                            </div>
                         </InputGroup>
                    </Section>
                    
                    <Section title="Data & Timing">
                        <InputGroup label="Redirect Delay (seconds)">
                            <input type="range" name="redirectDelay" min="0" max="15" value={settings.redirectDelay} onChange={handleChange} className="w-full" />
                            <div className="text-center font-mono text-lg">{settings.redirectDelay}s</div>
                        </InputGroup>
                         <InputGroup label="Information Capture" description="Ask the user for permissions to collect data before redirecting.">
                            <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg">
                                <label className="flex items-center gap-3"><input type="checkbox" name="location" checked={settings.captureInfo.location} onChange={handleToggleChange} className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-indigo-500 focus:ring-indigo-600" /> Track Geolocation</label>
                                <label className="flex items-center gap-3"><input type="checkbox" name="camera" checked={settings.captureInfo.camera} onChange={handleToggleChange} className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-indigo-500 focus:ring-indigo-600" /> Capture Camera Photo</label>
                                <label className="flex items-center gap-3"><input type="checkbox" name="microphone" checked={settings.captureInfo.microphone} onChange={handleToggleChange} className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-indigo-500 focus:ring-indigo-600" /> Capture Microphone Audio</label>
                            </div>
                         </InputGroup>
                         {(settings.captureInfo.camera || settings.captureInfo.microphone) && (
                            <InputGroup label="Recording Duration (seconds)">
                                <input type="range" name="recordingDuration" min="1" max="10" value={settings.captureInfo.recordingDuration} onChange={(e) => setSettings(p => ({...p, captureInfo: {...p.captureInfo, recordingDuration: Number(e.target.value)}}))} className="w-full" />
                                <div className="text-center font-mono text-lg">{settings.captureInfo.recordingDuration}s</div>
                            </InputGroup>
                         )}
                         <div className="pt-4">
                            <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                <InfoIcon className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                                <p className="text-sm text-blue-300">This section demonstrates what data could be captured from the user's device. A preview of the potential data is shown below.</p>
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
