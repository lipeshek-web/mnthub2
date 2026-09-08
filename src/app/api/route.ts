import { NextResponse } from "next/server";
import { dbMode } from "@/lib/db";

export async function GET() {
  // Diagnóstico rápido de persistência: o modo DEVE ser "turso" em produção
  // e no dev do dia a dia — "local" significa escrita presa no sandbox.
  const mode = dbMode();
  return NextResponse.json({
    message: "Hello, world!",
    storage: {
      mode,
      durable: mode === "turso",
      hint:
        mode === "turso"
          ? "Dados gravados no Turso (fonte da verdade)."
          : "⚠️ MODO LOCAL: dados presos no SQLite do sandbox — configure TURSO_DATABASE_URL/TURSO_AUTH_TOKEN (ver .zscripts/cloud.env).",
    },
  });
}
