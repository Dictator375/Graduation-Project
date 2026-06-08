export const DARK = {
  bg:        '#0d1117',
  card:      '#161b22',
  border:    'rgba(255,255,255,0.08)',
  text:      '#e6edf3',
  sub:       '#8b949e',
  muted:     '#484f58',
  statusBar: '#161b22',
  barBg:     '#161b22',
  trackBg:   'rgba(255,255,255,0.06)',
  accent:    '#E85D24',
  shadow:    'rgba(0,0,0,0.4)',
};

export const LIGHT = {
  bg:        '#f0f2f5',
  card:      '#ffffff',
  border:    'rgba(0,0,0,0.09)',
  text:      '#1c1e26',
  sub:       '#5a6072',
  muted:     '#9ba3af',
  statusBar: '#ffffff',
  barBg:     '#ffffff',
  trackBg:   'rgba(0,0,0,0.06)',
  accent:    '#E85D24',
  shadow:    'rgba(0,0,0,0.1)',
};

export function getThemeColors(theme) {
  return theme === 'light' ? LIGHT : DARK;
}
