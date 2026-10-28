import { getBackendUrl } from "./socket";

/**
 * Tạo URL đầy đủ cho REST API dựa trên môi trường (Dev, Production, Custom Domain)
 * @param {string} endpoint - Đường dẫn API (ví dụ: "/api/cards")
 * @returns {string} URL hoàn chỉnh đến máy chủ Backend
 */
export const getApiUrl = (endpoint = "") => {
  const base = getBackendUrl().replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

export { getBackendUrl };
