'use server';

import { db } from '@/firebase/server'; // Correctly import the server-side db instance
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';

async function runN8NAnalysis(runId: string, url: string, caption: string, commentCount: string) {
  try {
    console.log(`[Run ID: ${runId}] Starting background analysis...`);
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl || webhookUrl.includes('YOUR_N8N_WEBHOOK_URL_HERE')) {
      throw new Error('N8N_WEBHOOK_URL is not configured.');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        legenda: caption,
        quantidade_comentarios: commentCount ? parseInt(commentCount, 10) : 0,
      }),
      cache: 'no-store',
    });

    const responseBody = await response.text();
    if (!response.ok) {
      throw new Error(`Webhook returned an error: ${response.status} ${responseBody}`);
    }

    const data = JSON.parse(responseBody);

    await updateDoc(doc(db, 'analysisRuns', runId), {
      status: 'completed',
      result: data,
      finishedAt: new Date(),
    });
    console.log(`[Run ID: ${runId}] Analysis completed successfully.`);

  } catch (error: any) {
    console.error(`[Run ID: ${runId}] Background analysis failed:`, error);
    await updateDoc(doc(db, 'analysisRuns', runId), {
      status: 'failed',
      error: error.message || 'An unknown error occurred during analysis.',
      finishedAt: new Date(),
    });
  }
}

export async function startSentimentAnalysis(
  url: string,
  caption: string,
  commentCount: string
): Promise<{ runId: string } | { error: string }> {
  try {
    console.log('Received request to start analysis.');
    const runRef = await addDoc(collection(db, 'analysisRuns'), {
      url,
      caption,
      commentCount,
      status: 'processing',
      startedAt: new Date(),
      // This assumes a user context is available, which it isn't in this specific setup.
      // If you need to associate runs with users, the user ID must be passed to this action.
    });

    const runId = runRef.id;
    console.log(`Created analysis run with ID: ${runId}`);

    runN8NAnalysis(runId, url, caption, commentCount);

    return { runId };

  } catch (error: any) {
    console.error('Failed to start analysis run:', error);
    return { error: `Failed to start analysis: ${error.message}` };
  }
}

export async function getAnalysisResult(
  runId: string
): Promise<{ status: string; data?: any; error?: string } | { error: string }> {
  try {
    const runDoc = await getDoc(doc(db, 'analysisRuns', runId));

    if (!runDoc.exists()) {
      return { error: 'Analysis run not found.' };
    }

    const runData = runDoc.data();
    return {
      status: runData.status,
      data: runData.result,
      error: runData.error,
    };
  } catch (error: any) {
    console.error(`Failed to get analysis status for run ${runId}:`, error);
    return { error: `Failed to get analysis status: ${error.message}` };
  }
}
