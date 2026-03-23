/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  /** Vercel / Node サーバーで exceljs を正しく解決する */
  serverExternalPackages: ["exceljs"],
}

export default nextConfig
