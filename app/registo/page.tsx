"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegistoPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    console.log("🔹 A tentar registar:", email);

    try {
      const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

console.log("🔹 Resultado signUp:", { data, error });

if (error) {
  throw error;
}

// 👉 criar registo de créditos (2 por defeito)
if (data?.user?.id) {
  const { error: creditsError } = await supabase
    .from("user_credits")
    .insert({
      user_id: data.user.id,
      credits: 2,
    });

  if (creditsError) {
    console.error("Erro ao criar créditos do utilizador:", creditsError);
  }
}

setSuccess("Conta criada com sucesso! Já podes fazer login. 🎄");


      // Redirecionar para login depois de 1.5s
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
  console.error("❌ Erro no registo:", err);

  if (err instanceof Error) {
    if (err.message.includes("User already registered")) {
      setError("Já existe uma conta com esse email. Vai à página de login e entra.");
    } else {
      setError(err.message);
    }
  } else {
    setError("Ocorreu um erro ao criar a conta.");
  }
}
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900/70 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Criar conta na
          <span className="text-emerald-400"> Prime de Natal 🎄</span>
        </h1>

        <p className="text-sm text-slate-300 text-center">
          Regista-te para poderes usar créditos e gerar sugestões de presentes
          personalizadas.
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
              minLength={6}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Pelo menos 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {success && (
            <p className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-700/60 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-lg bg-emerald-400 text-black font-semibold py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-300 transition-transform hover:-translate-y-0.5"
          >
            {loading ? "A criar conta..." : "Criar conta"}
          </button>
        </form>

        <p className="text-xs text-center text-slate-300">
          Já tens conta?{" "}
          <a
            href="/login"
            className="text-emerald-400 hover:underline font-semibold"
          >
            Entrar
          </a>
        </p>
      </div>
    </main>
  );
}
