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

    let responseData = await response.json();

    // N8N webhooks sometimes wrap responses in an array.
    if (Array.isArray(responseData) && responseData.length > 0) {
      responseData = responseData[0];
    }
    
    // The actual data is nested under the 'output' key
    const rawData = responseData.output;

    if (typeof rawData !== 'object' || rawData === null) {
      console.error('Webhook returned invalid data format or missing "output" key:', responseData);
      return { error: 'O serviço de análise retornou uma resposta em formato inválido.' };
    }

    // Re-construct the object to ensure it's a plain, serializable object and handle missing data.
    const data: SentimentOutput = {
      resumo_geral: rawData.resumo_geral || 'Nenhum resumo foi gerado.',
      totais: {
        positivo: rawData.totais?.positivo ?? rawData.totais?.positivos ?? 0,
        neutro: rawData.totais?.neutro ?? rawData.totais?.neutros ?? 0,
        negativo: rawData.totais?.negativo ?? rawData.totais?.negativos ?? 0,
        total: rawData.totais?.total ?? 0,
      },
      comentarios_analisados: (rawData.comentarios_analisados || []).map((c: any): CommentAnalysis => ({
        nome_usuario: c.nome_usuario || 'desconhecido',
        link_comentario: c.link_comentario || '',
        texto: c.texto || '',
        sentimento: c.sentimento || 'NEUTRAL',
        justificativa_curta: c.justificativa_curta || '',
        confianca: c.confianca ?? 0,
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
