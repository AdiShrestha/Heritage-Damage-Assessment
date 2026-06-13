export const API_BASE_URL = 'http://192.168.103.173:8000/api/v1';

export const MAX_FILE_MB = 10;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
export const CLASS_NAMES = ['Undamaged', 'Partial Damage', 'Damaged'];

export const THEME = {
  primary: '#A63A2A',
  primaryLight: '#C54F3A',
  primaryDark: '#7A2A1A',
  primaryPale: '#F7EDE8',
  gold: '#D4A04A',
  goldLight: '#E8C47A',
  brick: '#C2714A',
  brickLight: '#E8D5C4',
  stone: '#7A726C',
  stoneLight: '#E2DCD6',
  wood: '#8B6F4A',
  success: '#1E6B3C',
  warning: '#B8860B',
  danger: '#A63A2A',
  surface: '#FFFFFF',
  bg: '#F5F0EB',
  text: '#1C1816',
  textMuted: '#7A726C',
  border: '#E2DCD6',
  borderLight: '#F0EBE6',
};

export const CLASS_CONFIG = {
  Undamaged: {
    color: '#1E6B3C',
    bgColor: '#EAF4EE',
    borderColor: '#B9DBC6',
    icon: 'shield-checkmark',
  },
  'Partial Damage': {
    color: '#B8860B',
    bgColor: '#FCF3DE',
    borderColor: '#E7D1A0',
    icon: 'warning',
  },
  Damaged: {
    color: '#A63A2A',
    bgColor: '#FDF0EC',
    borderColor: '#F2C3B7',
    icon: 'shield',
  },
};

export const MODELS = ['moe', 'resnet50', 'efficientnet_b4', 'vgg16', 'vit_b16', 'mock'];

export const SPACING = {
  screen: 16,
  card: 16,
  section: 20,
  element: 12,
  tight: 8,
};
