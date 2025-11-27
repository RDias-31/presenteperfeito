"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log("🔹 A tentar login com:", email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("🔹 Resultado login:", { data, error });

      if (error) {
        throw error;
      }

      // Se chegou aqui, login OK
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("❌ Erro no login:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro ao entrar.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900/70 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Entrar na
          <span className="text-emerald-400"> Prime de Natal 🎄</span>
        </h1>

        <p className="text-sm text-slate-300 text-center">
          Faz login para usares os teus créditos e gerar ideias de presentes.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="text-left space-y-1">
            <label className="text-sm text-slate-200">Email</label>
            <input
              type="email"
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="o.teu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="text-left space-y-1">
            <label className="text-sm text-slate-200">Password</label>
            <input
              type="password"
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-lg bg-emerald-400 text-black font-semibold py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-300 transition-transform hover:-translate-y-0.5"
          >
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <p className="text-xs text-center text-slate-300">
          Ainda não tens conta?{" "}
          <a
            href="/registo"
            className="text-emerald-400 hover:underline font-semibold"
          >
            Criar conta
          </a>
        </p>
      </div>
    </main>
  );
}
