import * as React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useNotification } from '../contexts/SettingsContext';
import type { Settings } from '../types';

const QrCodeModal = ({ config, onClose }: { config: Settings; onClose: () => void }) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const addNotification = useNotification();

  const handleDownloadQrCode = () => {
    if (!config?.bitlyLink) {
      addNotification({ type: 'error', message: 'QR code cannot be downloaded without a link.' });
      return;
    }
    const canvas = wrapperRef.current?.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${config.name.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } else {
      addNotification({ type: 'error', message: 'Could not find QR code canvas to download.' });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xs flex flex-col overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/70">
          <h3 className="font-semibold text-white text-lg">QR Code</h3>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
        </div>
        <div className="p-6 bg-slate-900 flex flex-col items-center gap-6">
          <div className="bg-white p-4 rounded-lg" ref={wrapperRef}>
            <QRCodeCanvas value={config.bitlyLink || ''} size={256} level="H" includeMargin={false} />
          </div>
          <p className="text-sm text-center text-indigo-400 font-mono break-all">{config.bitlyLink}</p>
          <button
            onClick={handleDownloadQrCode}
            className="w-full px-5 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrCodeModal;