export function toPercent(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function toMs(value) {
  return `${Math.round(value)}ms`;
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
