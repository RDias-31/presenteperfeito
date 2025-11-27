// src/app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-red-900 via-emerald-900 to-black text-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
          Beta • Natal 2025
        </p>

        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          Não sabes o que oferecer este Natal? <br />
          <span className="text-emerald-300">
            O teu assistente de presentes responde por ti.
          </span>
        </h1>

        <p className="text-base md:text-lg text-emerald-100/80">
          Responde a um pequeno quiz sobre a pessoa a quem queres oferecer um
          presente e recebe{" "}
          <span className="font-semibold">5 a 10 sugestões inteligentes</span>,
          criadas com inteligência artificial. Poupa tempo, evita presentes
          secos e ainda brilhas na noite de Natal. 🎁
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 mt-4">
          <a
             href="/registo"
             className="px-8 py-3 rounded-full bg-emerald-400 text-black font-semibold text-base md:text-lg shadow-lg shadow-emerald-900 hover:bg-emerald-300 transition-transform hover:-translate-y-0.5"
        >
            Começar agora
        </a>


          <p className="text-xs md:text-sm text-emerald-100/70">
            No registo ganhas{" "}
            <span className="font-semibold text-emerald-300">
              2 créditos grátis
            </span>{" "}
            para testar a app.
          </p>
        </div>

        <div className="mt-6 text-xs md:text-sm text-emerald-100/60">
          <p>Login, créditos e pagamentos vêm a seguir. Esta é só a base 😉</p>
        </div>
      </div>
    </main>
  );
}
