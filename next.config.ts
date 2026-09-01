import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Módulos nativos/externos do driver Turso-libSQL (modo nuvem do banco)
  serverExternalPackages: ["@libsql/client", "libsql", "@prisma/adapter-libsql"],
  // Não vazar a tecnologia do servidor
  poweredByHeader: false,
  // Cabeçalhos de segurança em todas as rotas
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            // camera/microphone precisam de (self): a sala de reunião (Jitsi em
            // iframe) não pode re-conceder permissão que o documento pai negou.
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(self), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
