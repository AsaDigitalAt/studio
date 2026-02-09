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
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      const responseText = await response.text().catch(() => 'Não foi possível ler o texto da resposta.');
      console.error('Falha ao analisar JSON do webhook N8N. Texto da resposta:', responseText, e);
      return { error: `O serviço de análise retornou uma resposta inesperada (não era um JSON). Verifique se a URL do webhook (${webhookUrl}) está correta, ativa e não está exibindo uma página de aviso. Resposta recebida: ${responseText.substring(0, 100)}...` };
    }
    
    // The webhook returns an array with a single object: `[ { "output": { ...data... } } ]`
    // Let's parse this exact structure.

    // 1. Check if it's an array with at least one element
    if (!Array.isArray(responseData) || responseData.length === 0) {
      console.error('Webhook response was not an array or was empty.', { responseData });
      return { error: 'A resposta do webhook não está no formato esperado (esperado: array não vazio).' };
    }

    // 2. Get the first element
    const executionData = responseData[0];

    // 3. Get the 'output' property from that element
    const rawData = executionData?.output;
    
    // 4. Stricter validation on the final data object
    if (
      typeof rawData !== 'object' ||
      rawData === null ||
      !rawData.resumo_geral ||
      !rawData.totais ||
      !Array.isArray(rawData.comentarios_analisados)
    ) {
      console.error(
        'Webhook response was missing expected data fields inside the "output" property.',
        { responseData }
      );
      return {
        error:
          'A resposta do serviço de análise está incompleta. O objeto "output" não contém os dados finais esperados.',
      };
    }

    const totais = rawData.totais;
    const comentarios = rawData.comentarios_analisados;

    const data: SentimentOutput = {
      resumo_geral: rawData.resumo_geral || 'Nenhum resumo foi gerado.',
      totais: {
        positivos: totais.positivos ?? 0,
        neutros: totais.neutros ?? 0,
        negativos: totais.negativos ?? 0,
        total: totais.total ?? totais.total_comentarios ?? 0,
      },
      comentarios_analisados: comentarios.map((c: any): CommentAnalysis => ({
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
        if (error.name === 'AbortError' || (error as any).code === 'ECONNRESET') {
           return { error: 'A conexão com o serviço de análise excedeu o tempo limite. Verifique se o webhook está ativo e responsivo.' };
        }
        return { error: `Falha na comunicação com o serviço de análise: ${error.message}` };
    }
    return { error: 'Ocorreu um erro desconhecido ao contatar o serviço de análise.' };
  }
}
