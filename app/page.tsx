"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center bg-gradient-to-b from-[#3a0000] to-[#003a34]">
      <div className="max-w-2xl mx-auto text-white space-y-6">
        <h2 className="text-sm opacity-80 tracking-widest">
          BETA • NATAL 2025
        </h2>

        <h1 className="text-4xl font-bold leading-tight">
          Não sabes o que oferecer este Natal? <br />
          <span className="text-[#8BFCC2]">O teu assistente de presentes responde por ti.</span>
        </h1>

        <p className="opacity-90 leading-relaxed">
          Responde a um pequeno quiz sobre a pessoa e recebe 5 a 10 sugestões inteligentes,
          criadas com inteligência artificial. Poupa tempo, evita presentes secos e ainda brilhas na noite de Natal.
        </p>

        {/* NOVO: Botões Separados */}
        <div className="flex items-center justify-center gap-4 pt-4">

          <Link
            href="/registo"
            className="px-6 py-3 bg-[#8BFCC2] text-black rounded-lg font-semibold hover:opacity-90 transition"
          >
            Registar
          </Link>

          <Link
            href="/login"
            className="px-6 py-3 border border-white text-white rounded-lg font-semibold hover:bg-white hover:text-black transition"
          >
            Entrar
          </Link>

        </div>

        <p className="text-xs opacity-70 pt-3">
          No registo ganhas <span className="text-[#8BFCC2] font-bold">2 créditos grátis</span> para testar a app.
        </p>

      </div>
    </main>
  );
}