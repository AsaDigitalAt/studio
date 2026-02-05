'use server';

import type { CommentAnalysis, SentimentOutput } from '@/lib/types';

export async function getSentimentAnalysis(
  url: string,
  caption: string,
  commentCount: string
): Promise<{ data: SentimentOutput } | { error: string }> {
  
  const webhookUrl = 'https://unreleasible-pocked-azucena.ngrok-free.dev/webhook/sentimento';

  if (!webhookUrl || webhookUrl.includes('placeholder')) {
    console.error('N8N_WEBHOOK_URL is not set or is a placeholder.');
    return { error: 'A URL do webhook de análise não está configurada.' };
  }
  
  console.log('Sending data to N8N webhook for analysis:', { url, caption, commentCount });

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        legenda: caption,
        quantidade_comentarios: commentCount ? parseInt(commentCount, 10) : 0,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`N8N webhook returned an error: ${response.status} ${response.statusText}`, {errorBody});
      return { error: `O serviço de análise retornou um erro: ${response.status}.` };
    }

    const rawData = await response.json();

    // Re-construct the object to ensure it's a plain, serializable object.
    const data: SentimentOutput = {
      resumo_geral: rawData.resumo_geral,
      totais: {
        positivos: rawData.totais.positivos,
        neutros: rawData.totais.neutros,
        negativos: rawData.totais.negativos,
        total: rawData.totais.total,
      },
      comentarios_analisados: (rawData.comentarios_analisados || []).map((c: any): CommentAnalysis => ({
        nome_usuario: c.nome_usuario,
        link_comentario: c.link_comentario,
        texto: c.texto,
        sentimento: c.sentimento,
        justificativa_curta: c.justificativa_curta,
        confianca: c.confianca,
      })),
    };

    return { data };

  } catch (error) {
    console.error('Failed to call N8N webhook:', error);
    if (error instanceof Error) {
        return { error: `Falha na comunicação com o serviço de análise: ${error.message}` };
    }
    return { error: 'Ocorreu um erro desconhecido ao contatar o serviço de análise.' };
  }
}
