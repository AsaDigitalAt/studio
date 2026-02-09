'use server';

import { db } from '@/firebase/server';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { analyzeLink } from '@/lib/utils';

export async function startSentimentAnalysis(
  url: string,
  caption: string,
  commentCount: string,
  userId: string
): Promise<{ runId: string } | { error: string }> {
  if (!userId) {
    return { error: 'Usuário não autenticado.' };
  }

  const { sourceType, normalizedUrl } = analyzeLink(url, caption);
  
  let runId: string;
  try {
    const runRef = await addDoc(collection(db, 'tagging_runs'), {
      sourceUrl: url,
      normalizedUrl: normalizedUrl,
      sourceType: sourceType,
      optionalText: caption,
      commentCount: commentCount ? parseInt(commentCount, 10) : 0,
      sentimentSummary: 'Análise em processamento...',
      createdAt: new Date(),
      createdBy: userId,
      confirmedUsernames: [],
      status: 'processing',
    });
    runId = runRef.id;
    console.log(`[Run ID: ${runId}] Registro de análise criado no Firestore.`);
  } catch (e: any) {
    console.error('Erro ao criar registro de análise no Firestore:', e);
    return { error: 'Não foi possível iniciar a análise. Falha ao contatar o banco de dados.' };
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes('YOUR_N8N_WEBHOOK_URL_HERE')) {
    console.error('A URL do webhook N8N não está configurada no arquivo .env.');
    await updateDoc(doc(db, 'tagging_runs', runId), { status: 'failed' });
    return { error: 'O serviço de análise não está configurado corretamente.' };
  }
  
  // Fire and forget: trigger the webhook but don't wait for it to finish.
  // Use a self-executing async function to handle potential errors without blocking.
  (async () => {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: runId,
          url,
          legenda: caption,
          quantidade_comentarios: commentCount ? parseInt(commentCount, 10) : 0,
        }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const responseBody = await response.text();
        console.error(`[Run ID: ${runId}] Falha ao ativar webhook: ${response.status} ${responseBody}`);
        await updateDoc(doc(db, 'tagging_runs', runId), { status: 'failed' });
      } else {
        console.log(`[Run ID: ${runId}] Webhook ativado com sucesso.`);
      }
    } catch (error) {
      console.error(`[Run ID: ${runId}] Erro ao disparar webhook:`, error);
      await updateDoc(doc(db, 'tagging_runs', runId), { status: 'failed' });
    }
  })();

  // Return immediately to the frontend
  return { runId };
}
