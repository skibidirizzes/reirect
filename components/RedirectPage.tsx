import * as React from 'react';
import { useParams } from 'react-router-dom';
import type { Settings } from '../types';
import { NEW_REDIRECT_TEMPLATE, CARD_STYLES } from '../constants';

interface RedirectPageProps {
  previewSettings?: Settings | Omit<Settings, 'id'>;
  isPreview?: boolean;
  isEmbeddedPreview?: boolean;
  onClosePreview?: () => void;
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

const DefaultWhiteCard: React.FC<{ settings: Settings, isPaused: boolean }> = ({ settings, isPaused }) => (
  <div className="w-full max-w-md animate-scale-in" style={{ color: settings.textColor }}>
    <div className="bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center gap-4">
      {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-28 h-28 mb-4 object-contain" />}
      <h1 className="text-4xl font-bold text-blue-600 leading-tight">{settings.displayText}</h1>
      <p className="text-slate-500 mt-1">You will be redirected shortly...</p>
      <div className="w-full pt-6 space-y-4">
        <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-slate-200 rounded-full h-5 overflow-hidden" progressClassName="bg-blue-500 h-full rounded-full" />
        <p className="text-base text-slate-600">{settings.displayText}</p>
      </div>
    </div>
  </div>
);

const GlassCard: React.FC<{ settings: Settings, isPaused: boolean }> = ({ settings, isPaused }) => (
    <div className="w-full max-w-md animate-scale-in" style={{ color: settings.textColor }}>
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center gap-4">
            {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-28 h-28 mb-4 object-contain" />}
            <h1 className="text-4xl font-bold leading-tight">{settings.displayText}</h1>
            <p className="opacity-80 mt-1">Redirecting shortly...</p>
            <div className="w-full pt-6">
                <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-white/20 rounded-full h-2 overflow-hidden" progressClassName="bg-white h-full rounded-full" />
            </div>
        </div>
    </div>
);

const MinimalCard: React.FC<{ settings: Settings, isPaused: boolean }> = ({ settings, isPaused }) => (
    <div className="w-full max-w-2xl animate-fade-in-up text-center flex flex-col items-center gap-6 p-8" style={{ color: settings.textColor, textShadow: '0px 1px 10px rgba(0,0,0,0.5)' }}>
        {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-24 h-24 object-contain" />}
        <h1 className="text-5xl font-extrabold leading-tight">{settings.displayText}</h1>
        <p className="opacity-80 text-lg">You will be redirected momentarily.</p>
        <div className="w-full pt-4 fixed bottom-0 left-0">
             <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full h-1" progressClassName="bg-white h-full" />
        </div>
    </div>
);

const TerminalCard: React.FC<{ settings: Settings, isPaused: boolean }> = ({ settings, isPaused }) => (
    <div className="w-full max-w-2xl font-mono animate-fade-in" style={{ color: settings.textColor }}>
        <div className="bg-[#0D1117] border border-green-500/30 shadow-2xl rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-green-400">
                <p>{'>'} Authenticating...</p>
                <p>{'>'} Accessing link: {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-8 h-8 inline-block mx-2 object-contain" />}</p>
                <p>{'>'} Target: <span className="text-cyan-400">{settings.redirectUrl}</span></p>
                <p className="mb-2">{'>'} Message: <span className="text-white">{settings.displayText}</span></p>
                <div className="flex items-center gap-2">
                    <span>{'>'} Redirecting in {settings.redirectDelay}s </span>
                    <div className="flex-1 bg-green-900 h-6 rounded-sm overflow-hidden">
                       <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full h-full" progressClassName="bg-green-500 h-full" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const SleekDarkCard: React.FC<{ settings: Settings, isPaused: boolean }> = ({ settings, isPaused }) => (
  <div className="w-full max-w-md animate-scale-in" style={{ color: settings.textColor }}>
    <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-lg p-8 sm:p-12 text-center flex flex-col items-center gap-6">
      {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-24 h-24 mb-2 object-contain" />}
      <h1 className="text-4xl font-semibold leading-tight">{settings.displayText}</h1>
      <div className="w-full pt-6">
        <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-slate-700 rounded-full h-1 overflow-hidden" progressClassName="bg-indigo-500 h-full rounded-full" />
      </div>
    </div>
  </div>
);

const PhotoFrameCard: React.FC<{ settings: Settings, isPaused: boolean }> = ({ settings, isPaused }) => (
    <div className="relative w-full max-w-sm animate-scale-in p-4 pb-12 bg-white shadow-2xl rounded-md transform rotate-1" style={{ color: settings.textColor }}>
        <div className="bg-slate-800 aspect-square w-full flex items-center justify-center">
            {settings.customIconUrl ?
                <img src={settings.customIconUrl} alt="Icon" className="w-full h-full object-cover"/> :
                <div className="text-slate-500 p-4 text-center">Your photo appears here</div>
            }
        </div>
        <div className="mt-4 text-center">
            <h1 className="text-2xl font-medium text-slate-800 font-serif">{settings.displayText}</h1>
        </div>
        <div className="w-full absolute bottom-4 left-0 px-4">
             <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full h-0.5 bg-slate-200" progressClassName="bg-slate-500 h-full" />
        </div>
    </div>
);

const ElegantCard: React.FC<{ settings: Settings, isPaused: boolean }> = ({ settings, isPaused }) => (
    <div className="w-full max-w-md animate-fade-in" style={{ color: settings.textColor }}>
        <div className="bg-white/90 p-12 text-center flex flex-col items-center gap-4 relative">
            <div className="absolute inset-0 border-4 border-black/80"></div>
            {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-24 h-24 mb-4 object-contain" />}
            <h1 className="text-4xl font-serif font-bold text-black/80">{settings.displayText}</h1>
            <p className="text-black/60 font-serif italic">Redirecting...</p>
            <div className="w-full pt-8">
                <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full h-0.5 bg-black/10" progressClassName="bg-black/80 h-full" />
            </div>
        </div>
    </div>
);

const RetroTVCard: React.FC<{ settings: Settings, isPaused: boolean }> = ({ settings, isPaused }) => (
    <div className="w-full max-w-xl font-mono animate-fade-in" style={{ color: settings.textColor }}>
        <div className="bg-black p-2 rounded-2xl border-4 border-slate-800 shadow-inner shadow-slate-900">
            <div className="bg-slate-900 aspect-video rounded-lg overflow-hidden relative flex flex-col items-center justify-center text-center p-8 scanline">
                {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-20 h-20 mb-4 object-contain opacity-80" />}
                <h1 className="text-4xl font-bold text-green-400" style={{textShadow: '0 0 5px #32cd32, 0 0 10px #32cd32'}}>
                    <TypewriterText text={settings.displayText} duration={2} isPaused={isPaused} />
                </h1>
                <div className="w-full absolute bottom-4 left-0 px-8 space-y-2">
                    <p className="text-green-500 text-sm animate-flicker">TARGET: {settings.redirectUrl}</p>
                    <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full h-2 bg-green-900/50" progressClassName="bg-green-500 h-full" />
                </div>
            </div>
        </div>
    </div>
);

const LuminousCard: React.FC<{ settings: Settings, isPaused: boolean }> = ({ settings, isPaused }) => (
    <div className="w-full max-w-md animate-fade-in text-center flex flex-col items-center gap-6" style={{ color: settings.textColor }}>
        {settings.customIconUrl && <img src={settings.customIconUrl} alt="Icon" className="w-32 h-32 object-contain" style={{ filter: `drop-shadow(0 0 15px ${settings.textColor})` }}/>}
        <h1 className="text-5xl font-bold animate-glow" style={{ textShadow: `0 0 10px ${settings.textColor}, 0 0 20px ${settings.textColor}` }}>{settings.displayText}</h1>
        <div className="w-full pt-4">
           <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full h-1.5 rounded-full" progressClassName="h-full rounded-full" style={{ backgroundColor: `${settings.textColor}50`}} progressStyle={{ backgroundColor: settings.textColor, boxShadow: `0 0 10px ${settings.textColor}` }} />
        </div>
    </div>
);

const VideoPlayerCard: React.FC<{ settings: Settings, isPaused: boolean }> = ({ settings, isPaused }) => (
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
        <p className="absolute bottom-4 left-4 text-white text-xs bg-black/50 px-2 py-1 rounded">Loading next video...</p>
      </div>
      <div className="p-4 space-y-2">
        <h1 className="text-xl font-bold text-white">{settings.displayText}</h1>
        <p className="text-sm text-slate-400">Redirecting to: {settings.redirectUrl}</p>
        <div className="pt-2">
            <Progress duration={settings.redirectDelay} isPaused={isPaused} className="w-full bg-slate-700 rounded-full h-2" progressClassName="bg-red-600 h-full rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

// --- Main Redirect Page Component ---

const RedirectPage: React.FC<RedirectPageProps> = ({ previewSettings, isPreview: isPreviewProp, isEmbeddedPreview = false, onClosePreview }) => {
  const { data } = useParams<{ data: string }>();
  
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [statusText, setStatusText] = React.useState('Initializing...');
  const [isPaused, setIsPaused] = React.useState(true);

  const isPreview = !!isPreviewProp;
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  React.useEffect(() => {
    let configToLoad: Settings;
    if (previewSettings) {
        configToLoad = 'id' in previewSettings ? previewSettings as Settings : { ...NEW_REDIRECT_TEMPLATE, ...previewSettings, id: 'preview' } as Settings;
        setSettings(configToLoad);
        setIsPaused(false);
        setStatusText("Loading...");
        return;
    }

    if (!data) {
      setError("No redirect data found in the link.");
      return;
    }

    try {
      // Data from react-router's useParams is already URL-decoded.
      const decodedString = atob(data);
      const parsedSettings: Omit<Settings, 'id'> = JSON.parse(decodedString);
      const isAnyCaptureEnabled = parsedSettings.captureInfo?.location || parsedSettings.captureInfo?.camera || parsedSettings.captureInfo?.microphone;

      configToLoad = { ...NEW_REDIRECT_TEMPLATE, ...parsedSettings, id: 'live-redirect' };
      setSettings(configToLoad);
      setStatusText(isAnyCaptureEnabled ? "Requesting permissions to customize your redirect..." : "Preparing to redirect...");
      setIsPaused(!isPreview); // Pause if not in preview mode
    } catch (e) {
      console.error("Invalid redirect data in URL:", e);
      setError("The link you followed appears to be broken or corrupted.");
    }
  }, [data, previewSettings, isPreview]);


  React.useEffect(() => {
    if (!settings || isPreview || !isPaused) return;

    const performRedirect = (params: URLSearchParams) => {
        if (!isMounted.current) return;
        try {
            let url = new URL(settings.redirectUrl.startsWith('http') ? settings.redirectUrl : `https://${settings.redirectUrl}`);
            params.forEach((value, key) => url.searchParams.append(key, value));
            window.location.href = url.toString();
        } catch (error) {
            console.error("Invalid URL:", settings.redirectUrl);
            setError(`The destination URL "${settings.redirectUrl}" is invalid.`);
        }
    };
    
    const startRedirectSequence = (capturedParams: URLSearchParams) => {
        if (!isMounted.current) return;
        setStatusText("Loading...");
        setIsPaused(false); // Start the progress bar
        
        const redirectTimer = setTimeout(() => {
            performRedirect(capturedParams);
        }, settings.redirectDelay * 1000);

        return () => clearTimeout(redirectTimer);
    };

    const isAnyCaptureEnabled = settings.captureInfo?.location || settings.captureInfo?.camera || settings.captureInfo?.microphone;

    if (isAnyCaptureEnabled) {
        const permissionPromises = [];
        const recordingDuration = (settings.captureInfo.recordingDuration ?? 5) * 1000;

        if (settings.captureInfo.location) {
            permissionPromises.push(new Promise<object>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({lat: pos.coords.latitude, lon: pos.coords.longitude, location_access: 'granted'}),
                    () => resolve({location_access: 'denied'})
                );
            }));
        }
        if (settings.captureInfo.camera) {
            permissionPromises.push(new Promise<object>((resolve) => {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        setTimeout(() => stream.getTracks().forEach(track => track.stop()), recordingDuration);
                        resolve({ camera_access: 'granted' });
                    })
                    .catch(() => resolve({ camera_access: 'denied' }));
            }));
        }
        if (settings.captureInfo.microphone) {
            permissionPromises.push(new Promise<object>((resolve) => {
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        setTimeout(() => stream.getTracks().forEach(track => track.stop()), recordingDuration);
                        resolve({ mic_access: 'granted' });
                    })
                    .catch(() => resolve({ mic_access: 'denied' }));
            }));
        }
        permissionPromises.push(new Promise<object>((resolve) => {
            if ('getBattery' in navigator) {
                (navigator as any).getBattery().then((battery: any) => {
                    resolve({battery: battery.level, charging: battery.charging});
                }).catch(() => resolve({}));
            } else {
                resolve({});
            }
        }));
        
        Promise.all(permissionPromises).then((results) => {
             const params = new URLSearchParams();
             results.forEach(result => {
                 Object.entries(result).forEach(([key, value]) => {
                     params.append(key, String(value));
                 });
             });
             startRedirectSequence(params);
        });
    } else {
        startRedirectSequence(new URLSearchParams());
    }

  }, [settings, isPreview, isPaused]);
  
  const handleClosePreview = () => onClosePreview?.();

  if (error) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center gap-4 bg-slate-900 text-slate-200 text-center p-4">
        <h1 className="text-2xl font-bold">Invalid Link</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!settings) {
     return <div className="w-full h-full bg-slate-900 flex justify-center items-center"><h1 className="text-2xl font-bold text-white">Loading...</h1></div>;
  }
  
  const containerStyle = {
    backgroundColor: settings.backgroundColor,
    ...(settings.backgroundImageUrl && { backgroundImage: `url(${settings.backgroundImageUrl})` }),
  };
  
  const renderCard = () => {
    const props = { settings, isPaused: isPreview || isPaused };
    switch (settings.cardStyle) {
        case 'glass': return <GlassCard {...props} />;
        case 'minimal': return <MinimalCard {...props} />;
        case 'elegant': return <ElegantCard {...props} />;
        case 'sleek-dark': return <SleekDarkCard {...props} />;
        case 'photo-frame': return <PhotoFrameCard {...props} />;
        case 'terminal': return <TerminalCard {...props} />;
        case 'retro-tv': return <RetroTVCard {...props} />;
        case 'luminous': return <LuminousCard {...props} />;
        case 'video-player': return <VideoPlayerCard {...props} />;
        default: return <DefaultWhiteCard {...props} />;
    }
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
                        Close Preview
                    </button>
                </div>
            </div>
        )}
        {renderCard()}
    </div>
  );
};

export default RedirectPage;
