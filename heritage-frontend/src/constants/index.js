export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const MAX_FILE_MB = Number(import.meta.env.VITE_MAX_FILE_MB ?? 10) || 10;

export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

export const CLASS_NAMES = ['Undamaged', 'Partial Damage', 'Damaged'];

export const CLASS_CONFIG = {
  Undamaged: {
    color: '#1E6B3C',
    bgColor: '#EAF4EE',
    borderColor: '#B9DBC6',
    icon: 'ShieldCheck',
  },
  'Partial Damage': {
    color: '#8A5A00',
    bgColor: '#FCF3DE',
    borderColor: '#E7D1A0',
    icon: 'AlertTriangle',
  },
  Damaged: {
    color: '#8B2500',
    bgColor: '#FDF0EC',
    borderColor: '#F2C3B7',
    icon: 'ShieldX',
  },
};

export const MODELS = ['mock', 'resnet50', 'efficientnet_b4', 'vit_b16'];
