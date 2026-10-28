import { Platform } from 'react-native';

/**
 * CẤU HÌNH KẾT NỐI MẠNG (NETWORK CONFIG)
 * 
 * Hỗ trợ linh hoạt:
 * 1. Biến môi trường EXPO_PUBLIC_API_URL (nếu được khai báo trong .env của mobile)
 * 2. Fallback về IP LAN của máy chủ Node.js backend (hoặc localhost khi test web)
 */

// Đọc cấu hình từ biến môi trường của Expo (chuẩn Expo SDK)
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

// Địa chỉ IPv4 mặc định của máy tính chạy server backend Node.js
export const SERVER_IP = '192.168.80.64';
export const SERVER_PORT = '5000';

const getBaseUrl = () => {
  if (ENV_API_URL && ENV_API_URL.trim()) {
    return ENV_API_URL.trim().replace(/\/$/, '');
  }
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }
  return `http://${SERVER_IP}:${SERVER_PORT}`;
};

export const API_BASE_URL = getBaseUrl();
export const SOCKET_URL = API_BASE_URL;

