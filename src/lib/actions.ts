'use server';

export async function getSentimentAnalysis(
  url: string,
  caption: string,
  commentCount: string
): Promise<{ success: true } | { error: string }> {
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

    const responseBody = await response.text();
    console.log('<<<<< INÍCIO DA RESPOSTA DO WEBHOOK >>>>>');
    console.log(responseBody);
    console.log('<<<<< FIM DA RESPOSTA DO WEBHOOK >>>>>');

    if (!response.ok) {
      console.error(
        `N8N webhook returned an error: ${response.status} ${response.statusText}`,
        { errorBody: responseBody }
      );
      return {
        error: `O serviço de análise retornou um erro: ${
          response.status
        }. Detalhes: ${responseBody.substring(0, 200)}`,
      };
    }

    return { success: true };
    
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
