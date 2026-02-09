'use server';

import { db } from '@/firebase/server';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { analyzeLink } from '@/lib/utils';
import { type SentimentOutput } from './types';

const WEBHOOK_URL = 'https://unreleasible-pocked-azucena.ngrok-free.dev/webhook-test/sentimento';

type WebhookResponsePayload = {
    output: {
      resumo_geral: string;
      totais: {
        total_comentarios: number;
        positivos: number;
        neutros: number;
        negativos: number;
      };
      comentarios_analisados: {
        nome_usuario: string;
        link_comentario: string;
        texto: string;
        sentimento: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
        justificativa_curta: string;
        confianca: number;
      }[];
    };
    runId: string;
}

export async function startSentimentAnalysis(
  url: string,
  caption: string,
  commentCount: string,
  userId: string
): Promise<{ runId: string; success: true } | { error: string }> {
  if (!userId) {
    return { error: 'Usuário não autenticado. Acesso negado.' };
  }

  let runId: string | null = null;

  try {
    const { sourceType, normalizedUrl } = analyzeLink(url);
    const runRef = await addDoc(collection(db, 'tagging_runs'), {
      sourceUrl: url,
      normalizedUrl,
      sourceType,
      optionalText: caption,
      commentCount: commentCount ? parseInt(commentCount, 10) : 0,
      createdBy: userId,
      createdAt: serverTimestamp(),
      status: 'processing',
      sentimentSummary: 'Análise em processamento...'
    });
    runId = runRef.id;
    console.log(`[Run ID: ${runId}] Missão criada. Aguardando resposta do webhook...`);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        url,
        legenda: caption,
        quantidade_comentarios: commentCount ? parseInt(commentCount, 10) : 0,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Webhook retornou erro ${response.status}: ${errorBody}`);
    }

    const webhookResult: WebhookResponsePayload[] = await response.json();
    console.log(`[Run ID: ${runId}] Webhook retornou sucesso. Processando e salvando resposta...`);

    if (!webhookResult || !Array.isArray(webhookResult) || webhookResult.length === 0) {
        throw new Error('Resposta do webhook em formato inválido ou vazia.');
    }

    const resultData = webhookResult[0];
    
    const sentimentData: SentimentOutput = {
        resumo_geral: resultData.output.resumo_geral,
        totais: {
            total: resultData.output.totais.total_comentarios,
            positivo: resultData.output.totais.positivos,
            neutro: resultData.output.totais.neutros,
            negativo: resultData.output.totais.negativos,
        },
        comentarios_analisados: resultData.output.comentarios_analisados,
    };
    
    await updateDoc(doc(db, 'tagging_runs', runId), {
      status: 'completed',
      sentimentData: sentimentData,
      sentimentSummary: sentimentData.resumo_geral,
      updatedAt: serverTimestamp()
    });

    console.log(`[Run ID: ${runId}] Missão concluída e dados salvos no Firestore.`);

    return { runId, success: true };

  } catch (error: any) {
    console.error(`[Run ID: ${runId || 'N/A'}] Erro no processo de análise:`, error);
    if (runId) {
      try {
        await updateDoc(doc(db, 'tagging_runs', runId), {
          status: 'failed',
          error: `Falha na análise: ${error.message}`,
          updatedAt: serverTimestamp()
        });
      } catch (dbError) {
        console.error(`[Run ID: ${runId}] Falha ao atualizar status para 'failed' no Firestore:`, dbError);
      }
    }
    return { error: `Não foi possível concluir a análise: ${error.message}` };
  }
}
