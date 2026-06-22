/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_BOOKING_API_URL: process.env.NEXT_PUBLIC_BOOKING_API_URL || "http://localhost:8005",
  },
};

export default nextConfig;
