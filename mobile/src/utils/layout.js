import { Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

const STATUS_BAR_HEIGHT = Platform.OS === 'android'
  ? StatusBar.currentHeight || 24
  : 44;

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : 54;

const scale = width / 390;
function rs(size) { return Math.round(size * Math.min(scale, 1.2)); }
function rp(size) { return Math.round(size * Math.min(scale, 1.15)); }

export { width, height, STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT, rs, rp };