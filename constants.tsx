import type { Settings } from './types';

// WARNING: For development/demonstration purposes only. 
// In a real production application, this API token should be stored securely 
// as an environment variable and not hardcoded in the source code.
export const BITLY_API_TOKEN = '11374a76652c99c89f6b6e1f5a8d09a2f3dadb6c';
export const BITLY_API_URL = 'https://api-ssl.bitly.com/v4';
export const APP_BASE_URL = 'https://reirect-skibidirizzes-projects.vercel.app';

// --- CLOUDINARY CONFIGURATION ---
// IMPORTANT: You must create an "unsigned upload preset" in your Cloudinary dashboard
// with the exact name below for media uploads to work.
export const CLOUDINARY_CLOUD_NAME = 'dnvkhmgj0';
export const CLOUDINARY_UPLOAD_PRESET = 'redirecter_preset';
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;


export const NEW_REDIRECT_TEMPLATE: Omit<Settings, 'id' | 'name'> = {
  redirectUrl: '',
  displayText: 'You are being redirected...',
  customIconUrl: '',
  backgroundColor: '#1e293b', // slate-800
  backgroundImageUrl: '',
  theme: 'dark',
  textColor: '#f1f5f9', // slate-100
  cardStyle: 'default-white',
  redirectDelay: 5,
  captureInfo: {
    permissions: [],
    recordingDuration: 5,
  },
  customBitlyPath: '',
  bitlyLink: '',
  bitlyId: '',
  gradientColors: ['#8B5CF6', '#EC4899', '#F59E0B'],
};

export const PREDEFINED_COLORS = [
  '#0f172a', // slate-900
  '#1e293b', // slate-800
  '#334155', // slate-700
  '#f1f5f9', // slate-100
  '#ffffff', // white
  '#000000', // black
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
];

export const CARD_STYLES = [
    { id: 'default-white', name: 'Default White' },
    { id: 'glass', name: 'Glass' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'elegant', name: 'Elegant' },
    { id: 'sleek-dark', name: 'Sleek Dark' },
    { id: 'article', name: 'Article' },
    { id: 'terminal', name: 'Terminal' },
    { id: 'retro-tv', name: 'Retro TV' },
    { id: 'gradient-burst', name: 'Gradient Burst' },
    { id: 'video-player', name: 'Video Player' },
];