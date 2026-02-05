'use server';

import type { SentimentOutput } from '@/lib/types';

const mockSentimentData: SentimentOutput = {
  resumo_geral: "O sentimento geral é majoritariamente positivo, com usuários expressando entusiasmo e apreciação pelo conteúdo. Uma pequena parte dos comentários é neutra, fazendo perguntas, enquanto uma fração negligenciável mostra feedback negativo relacionado a um detalhe específico.",
  totais: {
    positivos: 18,
    neutros: 4,
    negativos: 1,
    total: 23
  },
  comentarios_analisados: [
    { nome_usuario: 'user_alpha', link_comentario: 'https://instagram.com', texto: 'Isso é absolutamente incrível! A melhor coisa que vi o dia todo.', sentimento: 'POSITIVE', justificativa_curta: 'Expressa forte emoção positiva e elogio.', confianca: 98 },
    { nome_usuario: 'user_beta', link_comentario: 'https://instagram.com', texto: 'Quando isso aconteceu?', sentimento: 'NEUTRAL', justificativa_curta: 'Pergunta simples sem linguagem emocional.', confianca: 95 },
    { nome_usuario: 'user_gamma', link_comentario: 'https://instagram.com', texto: 'Não gostei da escolha da cor.', sentimento: 'NEGATIVE', justificativa_curta: 'Expressa descontentamento com um aspecto específico.', confianca: 92 },
    { nome_usuario: 'user_delta', link_comentario: 'https://instagram.com', texto: 'Uau! 🚀', sentimento: 'POSITIVE', justificativa_curta: 'Expressão positiva de entusiasmo.', confianca: 89 },
    { nome_usuario: 'explorador_cosmico', link_comentario: 'https://instagram.com', texto: 'Incrível! Mal posso esperar para ver mais. Continuem com o ótimo trabalho!', sentimento: 'POSITIVE', justificativa_curta: 'Mostra entusiasmo e incentivo.', confianca: 99},
    { nome_usuario: 'observador_das_estrelas', link_comentario: 'https://instagram.com', texto: 'Qual a previsão para o próximo lançamento?', sentimento: 'NEUTRAL', justificativa_curta: 'Busca por informação factual.', confianca: 97},
  ]
};

export async function getSentimentAnalysis(
  url: string,
  caption: string,
  commentCount: string
): Promise<{ data: SentimentOutput } | { error: string }> {
  console.log('Simulating sentiment analysis for:', { url, caption, commentCount });
  
  // Simulate network delay to feel more realistic
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  // Simulate a chance of failure, like the original code's fallback mechanism
  if (Math.random() < 0.1) {
    console.error('Simulated webhook failure.');
    return { error: 'Simulated webhook analysis failed.' };
  }

  // Return mocked data
  return { data: mockSentimentData };
}
