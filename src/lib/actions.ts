'use server';

import type { SentimentOutput } from '@/lib/types';

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

    const data: SentimentOutput = await response.json();
    return { data };

  } catch (error) {
    console.error('Failed to call N8N webhook:', error);
    if (error instanceof Error) {
        return { error: `Falha na comunicação com o serviço de análise: ${error.message}` };
    }
    return { error: 'Ocorreu um erro desconhecido ao contatar o serviço de análise.' };
  }
}
