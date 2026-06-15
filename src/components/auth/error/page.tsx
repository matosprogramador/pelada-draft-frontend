"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const params = useSearchParams();
  const reason = params.get("reason");

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-danger">
        {reason === "google_auth_failed"
          ? "Não foi possível entrar com o Google."
          : "Ocorreu um erro ao autenticar."}
      </p>
      <Link href="/login" className="text-primary underline">
        Voltar para login
      </Link>
    </div>
  );
}