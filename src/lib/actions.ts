'use server';

import { db } from '@/firebase/server';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { analyzeLink } from '@/lib/utils';

const TEST_WEBHOOK_URL = 'https://unreleasible-pocked-azucena.ngrok-free.dev/webhook-test/sentimento';

async function triggerWebhook(runId: string, url: string, caption: string, commentCount: string) {
  try {
    console.log(`[Run ID: ${runId}] Disparando webhook para: ${TEST_WEBHOOK_URL}`);
    const response = await fetch(TEST_WEBHOOK_URL, {
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

    const responseBody = await response.text();
    console.log(`[Run ID: ${runId}] Resposta do webhook (${response.status}):`, responseBody);

    if (!response.ok) {
      throw new Error(`Resposta do webhook: ${response.status} ${responseBody}`);
    }

  } catch (error: any) {
    console.error(`[Run ID: ${runId}] Falha ao disparar webhook:`, error.message);
    try {
      await updateDoc(doc(db, 'tagging_runs', runId), { 
        status: 'failed',
        error: `Falha na comunicação com o webhook: ${error.message}`
      });
    } catch (dbError) {
      console.error(`[Run ID: ${runId}] Falha ao atualizar o status para 'failed' no Firestore:`, dbError);
    }
  }
}

export async function startSentimentAnalysis(
  url: string,
  caption: string,
  commentCount: string,
  userId: string
): Promise<{ runId: string } | { error: string }> {
  if (!userId) {
    return { error: 'Usuário não autenticado. Acesso negado.' };
  }

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
      status: 'processing', // Estado inicial
      sentimentSummary: 'Análise iniciada...'
    });
    const runId = runRef.id;
    console.log(`[Run ID: ${runId}] Registro de análise criado no Firestore.`);

    triggerWebhook(runId, url, caption, commentCount);

    return { runId };

  } catch (error: any) {
    console.error('Erro ao iniciar o processo de análise:', error);
    return { error: 'Não foi possível iniciar a análise. Verifique o console do servidor para mais detalhes.' };
  }
}
