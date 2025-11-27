"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import type { GiftSuggestion } from "../api/sugestoes/route";

type Question = {
  id: string;
  question: string;
  type: "single" | "text";
  options?: string[];
  helper?: string;
};

type CreditsRow = {
  credits: number;
};

const QUESTIONS: Question[] = [
  {
    id: "idade",
    question: "Qual é a idade de quem vai receber o presente?",
    type: "text",
    helper: "Exemplo: 7 anos, 25 anos, 60 anos...",
  },
  {
    id: "genero",
    question: "Qual é o género dessa pessoa?",
    type: "single",
    options: ["Masculino", "Feminino"],
  },
  {
    id: "relacao",
    question: "Qual é a relação dessa pessoa contigo?",
    type: "single",
    options: [
      "Pai",
      "Mãe",
      "Namorado",
      "Namorada",
      "Filho/a",
      "Sobrinho/a",
      "Irmão",
      "Irmã",
      "Afilhado/a",
      "Outro membro da família",
      "Amigo/a",
      "Colega de trabalho",
    ],
  },
  {
    id: "orcamento",
    question: "Qual é o orçamento máximo para este presente?",
    type: "single",
    options: ["Até 20€", "20€ a 50€", "50€ a 100€", "Mais de 100€"],
  },
  {
    id: "estilo",
    question: "Qual é o estilo principal dessa pessoa?",
    type: "single",
    options: [
      "Mais caseiro/a",
      "Aventureiro/a",
      "Geek / Tecnologia",
      "Artístico/a",
      "Vaidoso/a (moda/beleza)",
      "Difícil de definir",
    ],
  },
  {
    id: "hobbies",
    question: "Quais são os hobbies ou interesses principais?",
    type: "text",
    helper: "Exemplo: futebol, carros, leitura, gaming, ginásio...",
  },
  {
    id: "prefere",
    question: "Ela prefere mais experiências ou objetos?",
    type: "single",
    options: [
      "Experiências (viagens, jantares, escapadinhas)",
      "Objetos (roupa, gadgets, decoração)",
      "Um mix dos dois",
      "Não sei bem",
    ],
  },
  {
    id: "tipo_presente",
    question: "Queres algo mais útil, emocional ou divertido?",
    type: "single",
    options: [
      "Útil (vai mesmo usar no dia a dia)",
      "Emocional (memórias, simbolismo)",
      "Divertido (algo para rir e criar momentos)",
      "Surpreende-me, pode ser qualquer um",
    ],
  },
  {
    id: "observacoes",
    question: "Há alguma observação especial que devamos ter em conta?",
    type: "text",
    helper:
      "Exemplo: não bebe álcool, é vegano, alergias, não gosta de roupa, adora viagens, etc.",
  },
];

export default function QuizPage() {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

  const currentQuestion = QUESTIONS[currentIndex];
  const totalQuestions = QUESTIONS.length;
  const currentAnswer = answers[currentQuestion.id] || "";
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // 🔹 Carregar utilizador + créditos ao abrir a página
  useEffect(() => {
    const loadUserAndCredits = async () => {
      try {
        setCreditsLoading(true);

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

        const { data: creditsRow, error: creditsError } = await supabase
          .from("user_credits")
          .select("credits")
          .eq("user_id", uid)
          .single<CreditsRow>();

        if (creditsError) {
          console.error(
            "Erro a carregar créditos:",
            creditsError.message,
            creditsError
          );
        }

        if (creditsRow?.credits !== undefined && creditsRow.credits !== null) {
          setCredits(Number(creditsRow.credits));
        } else {
          setCredits(0);
        }
      } catch (err) {
        console.error("Erro inesperado a carregar créditos:", err);
      } finally {
        setCreditsLoading(false);
      }
    };

    void loadUserAndCredits();
  }, [router]);

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);

      if (creditsLoading) {
        setError(
          "Ainda estamos a carregar os teus créditos. Tenta de novo já a seguir."
        );
        return;
      }

      if (credits === null || credits <= 0) {
        setError(
          "Já usaste todos os teus créditos. Em breve vais poder comprar mais pesquisas. 🎁"
        );
        return;
      }

      setLoading(true);
      setSuggestions([]);

      // garantir que temos o utilizador atual
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData?.user) {
        setError("Sessão expirada. Faz login outra vez.");
        router.push("/login");
        return;
      }

      const uid = userData.user.id;

      // chamar API da IA
      const res = await fetch("/api/sugestoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao gerar sugestões.");
      }

      const data = await res.json();

      const apiSuggestions = Array.isArray(data.suggestions)
        ? (data.suggestions as GiftSuggestion[])
        : [];

      setSuggestions(apiSuggestions);

      // 🔻 Descontar 1 crédito (estado + BD)
      const newCredits = Math.max(0, (credits ?? 0) - 1);
      setCredits(newCredits);

      const { error: updateError } = await supabase
        .from("user_credits")
        .update({ credits: newCredits })
        .eq("user_id", uid);

      if (updateError) {
        console.error(
          "Erro ao atualizar créditos:",
          updateError.message,
          updateError
        );
        setError(
          "Não foi possível atualizar os créditos. Tenta novamente mais tarde."
        );
      }
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Erro inesperado ao gerar sugestões.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const canGoNext = !!currentAnswer;
  const canSubmit =
    !!currentAnswer && !creditsLoading && (credits ?? 0) > 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl grid md:grid-cols-[2fr,1.5fr] gap-6">
        {/* Coluna do Quiz */}
        <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
          <header className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
                Quiz de Natal • Pergunta {currentIndex + 1} de {totalQuestions}
              </p>

              <div className="text-right">
                <p className="text-[11px] text-slate-300">Créditos</p>
                <p className="text-sm font-semibold text-emerald-400">
                  {creditsLoading ? "…" : credits ?? 0}
                </p>
              </div>
            </div>

            {/* Botão para voltar ao menu / dashboard */}
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-xs px-3 py-1 mt-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:border-emerald-400 hover:text-emerald-300 transition"
            >
              ← Voltar ao Menu
            </button>

            <h1 className="text-xl md:text-2xl font-bold">
              Diz-nos quem vai receber o presente 🎄
            </h1>
            <p className="text-xs md:text-sm text-slate-300">
              Quanto melhor descreveres a pessoa, mais certeiras vão ser as
              sugestões.
            </p>

            {/* Barra de progresso */}
            <div className="mt-3 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all"
                style={{
                  width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>
          </header>

          {/* Pergunta atual */}
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg md:text-xl font-semibold">
                {currentQuestion.question}
              </h2>
              {currentQuestion.helper && (
                <p className="text-xs md:text-sm text-slate-300">
                  {currentQuestion.helper}
                </p>
              )}
            </div>

            {currentQuestion.type === "single" && currentQuestion.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mt-2">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleAnswerChange(option)}
                    className={`text-left text-xs md:text-sm rounded-lg border px-3 py-2 transition ${
                      currentAnswer === option
                        ? "bg-emerald-400 text-black border-emerald-300"
                        : "bg-slate-900/80 border-slate-700 hover:border-emerald-400/60"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === "text" && (
              <textarea
                className="w-full min-h-[100px] rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Escreve aqui a tua resposta..."
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
              />
            )}
          </section>

          {/* Botões de navegação */}
          <footer className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0 || loading}
              className="w-full md:w-auto text-xs md:text-sm px-4 py-2 rounded-lg border border-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-400/70 transition"
            >
              ← Anterior
            </button>

            {!isLastQuestion && (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext || loading}
                className="w-full md:w-auto text-xs md:text-sm px-6 py-2 rounded-lg bg-emerald-400 text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-300 transition-transform hover:-translate-y-0.5"
              >
                Seguinte →
              </button>
            )}

            {isLastQuestion && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                className="w-full md:w-auto text-xs md:text-sm px-6 py-2 rounded-lg bg-emerald-400 text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-300 transition-transform hover:-translate-y-0.5"
              >
                {loading
                  ? "A gerar sugestões..."
                  : credits !== null && credits <= 0
                  ? "Sem créditos disponíveis"
                  : "Concluir e gerar presentes 🎁"}
              </button>
            )}
          </footer>

          {error && (
            <p className="mt-2 text-xs md:text-sm text-red-400">{error}</p>
          )}
        </div>

        {/* Coluna das Sugestões */}
        <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-4 md:p-6 shadow-xl space-y-3 text-sm md:text-base">
          <h2 className="text-lg font-semibold text-emerald-300">
            Sugestões de presentes
          </h2>

          {!loading && !error && suggestions.length === 0 && (
            <p className="text-xs md:text-sm text-slate-300">
              Assim que completares o quiz e clicares em &quot;Concluir e gerar
              presentes&quot;, as sugestões vão aparecer aqui. 🎄
            </p>
          )}

          {loading && (
            <p className="text-xs md:text-sm text-emerald-200">
              A pensar em presentes perfeitos... ✨
            </p>
          )}

          {suggestions.length > 0 && !loading && !error && (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {suggestions.map((s, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-slate-950/70 border border-emerald-700/50 p-3 md:p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-emerald-300">
                      Sugestão {index + 1}
                    </span>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 capitalize">
                      {s.type}
                    </span>
                  </div>

                  <h3 className="text-sm md:text-base font-semibold text-emerald-50">
                    {s.title}
                  </h3>

                  <p className="text-xs md:text-sm text-emerald-100">
                    <span className="font-semibold">Valor aproximado:</span>{" "}
                    {s.budget}
                  </p>

                  <p className="text-xs md:text-sm text-slate-100">
                    <span className="font-semibold">Porque faz sentido:</span>{" "}
                    {s.why}
                  </p>

                  {s.whereToBuy && s.whereToBuy.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[11px] md:text-xs font-semibold text-emerald-300">
                        Onde comprar:
                      </p>
                      <ul className="mt-1 space-y-1">
                        {s.whereToBuy.map((loja, i) => (
                          <li
                            key={i}
                            className="text-[11px] md:text-xs text-emerald-100"
                          >
                            •{" "}
                            {loja.url ? (
                              <a
                                href={loja.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline hover:text-emerald-300"
                              >
                                {loja.name}
                              </a>
                            ) : (
                              loja.name
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
