"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// 👇 usa o MESMO caminho que já funciona no login/registo
import { supabase } from "../../lib/supabaseClient";

type CreditsRow = {
  credits: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserAndCredits = async () => {
      try {
        setLoading(true);

        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData?.user) {
          console.error("Utilizador não autenticado, a redirecionar...", {
            userError,
          });
          router.push("/login");
          return;
        }

        const uid = userData.user.id;
        setEmail(userData.user.email ?? null);

        const { data: creditsRow, error: creditsError } = await supabase
          .from("user_credits")
          .select("credits")
          .eq("user_id", uid)
          .single<CreditsRow>();

        if (creditsError) {
          console.error("Erro a carregar créditos:", creditsError);
        }

        if (creditsRow?.credits !== undefined && creditsRow.credits !== null) {
          setCredits(creditsRow.credits);
        } else {
          setCredits(0);
        }
      } catch (err) {
        console.error("Erro inesperado a carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadUserAndCredits();
  }, [router]);

  const handleStartQuiz = () => {
    router.push("/quiz");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-slate-900/70 border border-slate-700/60 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
              Painel Natal 🎄
            </p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">
              Bem-vindo à tua área
            </h1>
            {email && (
              <p className="text-xs md:text-sm text-slate-300 mt-1">
                Sessão iniciada como{" "}
                <span className="font-semibold text-emerald-300">
                  {email}
                </span>
              </p>
            )}
          </div>

          <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl px-4 py-3 text-right">
            <p className="text-[11px] text-slate-300 uppercase tracking-wide">
              Créditos disponíveis
            </p>
            <p className="text-2xl font-bold text-emerald-400">
              {loading ? "…" : credits ?? 0}
            </p>
            <p className="text-[11px] text-slate-400">
              1 pesquisa = 1 crédito
            </p>
          </div>
        </header>

        <section className="grid md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={handleStartQuiz}
            className="rounded-xl bg-emerald-400 text-black font-semibold px-4 py-3 text-sm shadow hover:bg-emerald-300 transition-transform hover:-translate-y-0.5"
          >
            🎁 Começar novo quiz
          </button>

          <button
            type="button"
            disabled
            className="rounded-xl bg-slate-800 text-slate-300 border border-slate-600 px-4 py-3 text-sm shadow cursor-not-allowed opacity-60"
          >
            📊 Painel de controlo (breve)
          </button>

          <button
            type="button"
            disabled
            className="rounded-xl bg-slate-800 text-slate-300 border border-slate-600 px-4 py-3 text-sm shadow cursor-not-allowed opacity-60"
          >
            📜 Consultar pesquisas (em breve)
          </button>
        </section>

        <section className="text-xs md:text-sm text-slate-300 space-y-1">
          <p>
            • Cada vez que geras uma lista de presentes no quiz, gastas{" "}
            <span className="font-semibold text-emerald-300">
              1 crédito
            </span>
            .
          </p>
          <p>
            • Recebeste{" "}
            <span className="font-semibold text-emerald-300">
              Parabéns tens 2 créditos de oferta 
            </span>{" "}
            quando criaste a conta.
          </p>
          <p>• Em breve vais poder comprar mais créditos diretamente aqui.</p>
        </section>
      </div>
    </main>
  );
}
