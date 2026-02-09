'use server';

import type { CommentAnalysis, SentimentOutput } from '@/lib/types';

export async function getSentimentAnalysis(
  url: string,
  caption: string,
  commentCount: string
): Promise<{ data: SentimentOutput } | { error: string }> {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl || webhookUrl.includes('YOUR_N8N_WEBHOOK_URL_HERE')) {
      console.error('N8N_WEBHOOK_URL is not set or is a placeholder in .env file.');
      return {
        error:
          'A URL do webhook de análise (N8N_WEBHOOK_URL) não está configurada no arquivo .env.',
      };
    }

    console.log('Sending data to N8N webhook for analysis:', {
      url,
      caption,
      commentCount,
    });

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
      console.error(
        `N8N webhook returned an error: ${response.status} ${response.statusText}`,
        { errorBody }
      );
      return {
        error: `O serviço de análise retornou um erro: ${
          response.status
        }. Detalhes: ${errorBody.substring(0, 200)}`,
      };
    }
    
    const responseText = await response.text();
    if (!responseText) {
        return { error: 'O serviço de análise retornou uma resposta vazia.' };
    }

    let responseData;
    try {
        responseData = JSON.parse(responseText);
    } catch (e) {
        console.error('Failed to parse N8N webhook response as JSON:', responseText);
        return {
            error: `Falha ao analisar a resposta do serviço: Não é um JSON válido. Verifique se o webhook (${webhookUrl}) está retornando a estrutura correta.`,
        };
    }

    // Rigorous validation based on user-provided JSON structure: [ { output: { ... } } ]
    if (!Array.isArray(responseData) || responseData.length === 0) {
      console.error('Webhook response was not an array or was empty.', {
        responseData,
      });
      return {
        error:
          'Resposta inesperada do serviço. O resultado não é um array ou está vazio.',
      };
    }

    const output = responseData[0]?.output;

    if (
      !output ||
      typeof output.resumo_geral !== 'string' ||
      !output.totais ||
      typeof output.totais.positivo !== 'number' ||
      typeof output.totais.neutro !== 'number' ||
      typeof output.totais.negativo !== 'number' ||
      !Array.isArray(output.comentarios_analisados)
    ) {
      console.error(
        'Webhook response "output" property is malformed or missing fields.',
        { output }
      );
      return {
        error:
          'A propriedade "output" na resposta do serviço está em um formato inválido ou com campos ausentes.',
      };
    }

    const data: SentimentOutput = {
      resumo_geral: output.resumo_geral,
      totais: {
        positivo: output.totais.positivo,
        neutro: output.totais.neutro,
        negativo: output.totais.negativo,
        total: output.totais.total ?? 0,
      },
      comentarios_analisados: output.comentarios_analisados.map(
        (c: any): CommentAnalysis => ({
          nome_usuario: c.nome_usuario ?? 'desconhecido',
          link_comentario: c.link_comentario ?? '',
          texto: c.texto ?? '',
          sentimento: c.sentimento ?? 'NEUTRAL',
          justificativa_curta: c.justificativa_curta ?? '',
          confianca: c.confianca ?? 0,
        })
      ),
    };

    return { data };
  } catch (error: any) {
    console.error('<<<<< UNHANDLED ERROR IN getSentimentAnalysis >>>>>', error);

    if (error.name === 'AbortError' || error.code === 'ECONNRESET' || error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' || error.cause?.code === 'EAI_AGAIN') {
       return { error: 'A conexão com o serviço de análise excedeu o tempo limite ou falhou. Verifique se o webhook está ativo e acessível.' };
    }
    
    return {
      error: `Ocorreu um erro de comunicação inesperado: ${error.message}`,
    };
  }
}
