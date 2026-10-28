import { io } from 'socket.io-client';
import { SOCKET_URL } from '../constants/config';

/**
 * QUẢN LÝ KẾT NỐI SOCKET.IO TẬP TRUNG (SINGLETON PATTERN)
 * 
 * Tại sao cần dùng mô hình này?
 * - Tránh việc mỗi màn hình/component tạo ra một kết nối Socket mới làm nghẽn server và xung đột dữ liệu.
 * - Toàn bộ ứng dụng dùng chung DUY NHẤT một socket instance xuyên suốt vòng đời.
 */

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // Ưu tiên websocket và fallback polling để chống lỗi kết nối mạng di động/tunnel
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ [Socket Mobile] Kết nối thành công! Socket ID:', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('⚠️ [Socket Mobile] Mất kết nối:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.log('❌ [Socket Mobile] Lỗi kết nối Socket:', err.message);
    });
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log('🔌 [Socket Mobile] Đã chủ động đóng kết nối Socket.');
  }
};
