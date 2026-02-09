'use server';

import type { CommentAnalysis, SentimentOutput } from '@/lib/types';

export async function getSentimentAnalysis(
  url: string,
  caption: string,
  commentCount: string
): Promise<{ data: SentimentOutput } | { error: string }> {
  
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl.includes('YOUR_N8N_WEBHOOK_URL_HERE')) {
    console.error('N8N_WEBHOOK_URL is not set or is a placeholder in .env file.');
    return { error: 'A URL do webhook de análise (N8N_WEBHOOK_URL) não está configurada no arquivo .env.' };
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
      return { error: `O serviço de análise retornou um erro: ${response.status}. Verifique a URL e o status do seu webhook N8N. Detalhes: ${errorBody.substring(0, 150)}` };
    }
    
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Falha ao analisar JSON do webhook N8N. Texto da resposta:', responseText, e);
      return { error: `O serviço de análise retornou uma resposta inesperada (não era um JSON válido). Verifique se a URL do webhook (${webhookUrl}) está correta e ativa. Resposta recebida: ${responseText.substring(0, 150)}...` };
    }
    
    const output = responseData?.[0]?.output;

    if (
      !output ||
      typeof output.resumo_geral !== 'string' ||
      typeof output.totais !== 'object' ||
      output.totais === null ||
      !Array.isArray(output.comentarios_analisados)
    ) {
      console.error(
        'Webhook response was missing expected data fields inside the "output" property of the first array element.',
        { responseData }
      );
      return {
        error:
          'A resposta do serviço de análise está em um formato inesperado. O objeto "output" não foi encontrado ou não contém os dados esperados.',
      };
    }

    const totais = output.totais;
    const comentarios = output.comentarios_analisados;

    const data: SentimentOutput = {
      resumo_geral: output.resumo_geral,
      totais: {
        positivo: totais.positivo ?? 0,
        neutro: totais.neutro ?? 0,
        negativo: totais.negativo ?? 0,
        total: totais.total ?? 0,
      },
      comentarios_analisados: comentarios.map((c: any): CommentAnalysis => ({
        nome_usuario: c.nome_usuario ?? 'desconhecido',
        link_comentario: c.link_comentario ?? '',
        texto: c.texto ?? '',
        sentimento: c.sentimento ?? 'NEUTRAL',
        justificativa_curta: c.justificativa_curta ?? '',
        confianca: c.confianca ?? 0,
      })),
    };

    return { data };

  } catch (error) {
    console.error('Failed to call N8N webhook:', error);
    if (error instanceof Error) {
        if (error.name === 'AbortError' || (error as any).code === 'ECONNRESET') {
           return { error: 'A conexão com o serviço de análise excedeu o tempo limite. Verifique se o webhook está ativo e responsivo.' };
        }
        return { error: `Falha na comunicação com o serviço de análise: ${error.message}` };
    }
    return { error: 'Ocorreu um erro desconhecido ao contatar o serviço de análise.' };
  }
}
