import OpenAI from "openai";
import { NextResponse } from "next/server";

type WhereToBuy = {
  name: string;
  url?: string;
};

export type GiftSuggestion = {
  title: string;
  type: string; // emocional / prático / divertido / misto
  budget: string; // ex: "40-70€" ou "baixo"
  why: string;
  whereToBuy?: WhereToBuy[];
};

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY não está definida");
      return NextResponse.json(
        { error: "Configuração de IA em falta no servidor." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const answers = body.answers as Record<string, string> | undefined;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Respostas do quiz em falta." },
        { status: 400 }
      );
    }

    // 🔹 Descrição adaptada às novas perguntas do quiz
    const descricao = `
    Idade: ${answers.idade || "não indicado"}
    Género: ${answers.genero || "não indicado"}
    Relação: ${answers.relacao || "não indicado"}
    Orçamento: ${answers.orcamento || "não indicado"}
    Estilo: ${answers.estilo || "não indicado"}
    Hobbies / interesses: ${answers.hobbies || "não indicado"}
    Prefere: ${answers.prefere || "não indicado"}
    Tipo de presente desejado: ${answers.tipo_presente || "não indicado"}
    Observações especiais: ${answers.observacoes || "não indicado"}
    `;

    const systemPrompt = `
Tu és um especialista em presentes de Natal e presentes em geral.
Recebes um conjunto de respostas sobre a pessoa que vai receber o presente e deves devolver APENAS JSON com uma lista de sugestões de presentes.

Regras importantes:
- Cria entre 5 e 10 sugestões de presentes.
- Cada sugestão deve ter:
  - "title": nome curto do presente.
  - "type": categoria geral (ex: "emocional", "útil", "experiência", "divertido", "personalizado", "misto").
  - "budget": texto simples com o intervalo de preço (ex: "até 20€", "20-50€", "50-100€", "100€+").
  - "why": explicação em linguagem simples e amigável de porque é que este presente faz sentido para aquela pessoa (2–3 frases).
  - "whereToBuy": lista de 1 a 3 locais onde a pessoa pode encontrar esse tipo de presente.

Sobre o campo "whereToBuy":
- Mistura grandes superfícies (Amazon.es, Fnac, Worten, Decathlon, etc.) com mercados locais e lojas mais pequenas online.
- Sempre que possível, inclui pelo menos UMA opção que não seja grande superfície, por exemplo:
  - "loja local de decoração"
  - "mercearia gourmet local"
  - "loja de artesanato da tua cidade"
  - "loja local de brinquedos"
  - plataformas de artesanato ou peças únicas.
- Não uses apenas grandes superfícies em todas as sugestões. Tenta que, no máximo, haja UMA grande superfície por sugestão.
- Quando usares "url", utiliza links de PESQUISA, não de produto específico. Exemplo:
  - "https://www.amazon.es/s?k=colar+personalizado"
  - "https://www.fnac.pt/SearchResult/ResultList.aspx?Search=experiencia+spa"

Sobre presentes personalizados:
- Sempre que fizer sentido (ex.: canecas personalizadas, quadros com foto, peças com nome, datas especiais, etc.),
  uma das sugestões deve ser claramente um presente personalizado.
- Para essa sugestão personalizada, no campo "whereToBuy" inclui SEMPRE uma entrada com:
  {
    "name": "Personalizaaki (Instagram)",
    "url": "https://instagram.com/personalizaaki"
  }

Formato de resposta:
- Responde SEMPRE em JSON válido, sem markdown e sem texto fora do JSON, no seguinte formato:

{
  "suggestions": [
    {
      "title": "...",
      "type": "...",
      "budget": "...",
      "why": "...",
      "whereToBuy": [
        { "name": "...", "url": "https://..." },
        { "name": "...", "url": null }
      ]
    }
  ]
}

Restrições:
- NÃO uses markdown.
- NÃO coloques nada fora do JSON.
- NÃO coloques comentários.
- NÃO inventes preços exatos, apenas faixas (ex: "20-50€").
`;

    const userPrompt = `
Pessoa que vai receber o presente de Natal (descrição vinda de um quiz):

${descricao}

Agora, devolve APENAS o JSON no formato pedido, com entre 5 e 10 sugestões.
`;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      console.error("Resposta vazia da OpenAI");
      return NextResponse.json(
        { error: "Não foi possível gerar sugestões." },
        { status: 500 }
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("Erro ao fazer JSON.parse na resposta da IA:", raw);
      return NextResponse.json(
        { error: "Resposta da IA inválida (JSON)." },
        { status: 500 }
      );
    }

    // extração segura das sugestões
    let suggestionsRaw: unknown = undefined;

    if (
      parsed &&
      typeof parsed === "object" &&
      parsed !== null &&
      "suggestions" in parsed
    ) {
      suggestionsRaw = (parsed as Record<string, unknown>).suggestions;
    }

    // Se vier um único objeto em vez de array, convertemos em array
    if (!Array.isArray(suggestionsRaw)) {
      suggestionsRaw = suggestionsRaw ? [suggestionsRaw] : [];
    }

    const suggestions: GiftSuggestion[] = (suggestionsRaw as unknown[]).map(
      (s) => {
        const obj = s as Record<string, unknown>;

        const whereToBuyRaw = Array.isArray(obj.whereToBuy)
          ? obj.whereToBuy
          : [];

        const whereToBuy = whereToBuyRaw.map((w) => {
          const wObj = w as Record<string, unknown>;
          return {
            name: String(wObj.name ?? "").trim(),
            url: wObj.url ? String(wObj.url).trim() : undefined,
          };
        });

        return {
          title: String(obj.title ?? "").trim(),
          type: String(obj.type ?? "").trim(),
          budget: String(obj.budget ?? "").trim(),
          why: String(obj.why ?? "").trim(),
          whereToBuy,
        };
      }
    );

    if (!suggestions.length) {
      return NextResponse.json(
        { error: "Não foram geradas sugestões válidas." },
        { status: 500 }
      );
    }

    return NextResponse.json({ suggestions });
  } catch (err: unknown) {
    console.error("Erro na API /api/sugestoes:", err);

    const message =
      err instanceof Error ? err.message : "Ocorreu um erro interno.";

    return NextResponse.json(
      { error: `Erro ao gerar sugestões: ${message}` },
      { status: 500 }
    );
  }
}
