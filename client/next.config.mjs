import path from "path";

const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: false,
  turbopack: {
    root: path.resolve(".."),
  },
  ...(isProd
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${backendUrl}/api/:path*`,
            },
          ];
        },
      }),
};

export default nextConfig;
