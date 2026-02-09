'use server';

import { db } from '@/firebase/server';
import { addDoc, collection } from 'firebase/firestore';
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

  try {
    const { sourceType, normalizedUrl } = analyzeLink(url, caption);

    // 1. Salva a execução inicial no Firestore para acionar regras de segurança
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

    const runId = runRef.id;
    console.log(`[Run ID: ${runId}] Registro de análise criado no Firestore.`);

    // 2. Dispara o webhook N8N
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl || webhookUrl.includes('YOUR_N8N_WEBHOOK_URL_HERE')) {
      throw new Error('A URL do webhook N8N não está configurada no arquivo .env.');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: runId, // Passa o ID para o N8N poder atualizar o documento
        url,
        legenda: caption,
        quantidade_comentarios: commentCount ? parseInt(commentCount, 10) : 0,
      }),
      cache: 'no-store',
    });

    // 3. Verifica se o webhook foi ativado com sucesso.
    if (!response.ok) {
      const responseBody = await response.text();
      console.error(`Webhook retornou um erro: ${response.status} ${responseBody}`);
      throw new Error(`O webhook retornou um erro: ${response.status}. Verifique o console do servidor para detalhes.`);
    }

    console.log(`[Run ID: ${runId}] Webhook ativado com sucesso.`);
    
    // O N8N é agora responsável por atualizar o documento no Firestore usando o runId.

    return { runId };

  } catch (error: any) {
    console.error('Falha ao iniciar a análise:', error);
    return { error: error.message || 'Ocorreu um erro desconhecido.' };
  }
}
