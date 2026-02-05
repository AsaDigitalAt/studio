'use server';

/**
 * @fileOverview Summarizes the sentiment analysis of an Instagram post's comments.
 *
 * - summarizeSentiment - A function that summarizes sentiment analysis data.
 * - SummarizeSentimentInput - The input type for the summarizeSentiment function.
 * - SummarizeSentimentOutput - The return type for the summarizeSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CommentAnalysisSchema = z.object({
  nome_usuario: z.string().describe('The username of the commenter.'),
  link_comentario: z.string().describe('The link to the comment.'),
  texto: z.string().describe('The text of the comment.'),
  sentimento: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).describe('The sentiment of the comment.'),
  justificativa_curta: z.string().describe('A short justification for the sentiment.'),
  confianca: z.number().describe('The confidence level of the sentiment analysis.'),
});

const SentimentTotalsSchema = z.object({
  positivos: z.number().describe('The number of positive comments.'),
  neutros: z.number().describe('The number of neutral comments.'),
  negativos: z.number().describe('The number of negative comments.'),
  total: z.number().describe('The total number of comments.'),
});

const SummarizeSentimentInputSchema = z.object({
  comentarios_analisados: z.array(CommentAnalysisSchema).describe('An array of analyzed comments.'),
  totais: SentimentTotalsSchema.describe('The totals of sentiment analysis.'),
});
export type SummarizeSentimentInput = z.infer<typeof SummarizeSentimentInputSchema>;

const SummarizeSentimentOutputSchema = z.object({
  resumo_geral: z.string().describe('A summary of the sentiment analysis.'),
});
export type SummarizeSentimentOutput = z.infer<typeof SummarizeSentimentOutputSchema>;

export async function summarizeSentiment(input: SummarizeSentimentInput): Promise<SummarizeSentimentOutput> {
  return summarizeSentimentFlow(input);
}

const summarizeSentimentPrompt = ai.definePrompt({
  name: 'summarizeSentimentPrompt',
  input: {schema: SummarizeSentimentInputSchema},
  output: {schema: SummarizeSentimentOutputSchema},
  prompt: `Given the sentiment analysis of an Instagram post's comments, provide a summary of the overall emotional tone.

Comment Analysis: {{{JSON.stringify comentarios_analisados}}}
Sentiment Totals: {{{JSON.stringify totais}}}

Provide a concise summary of the overall sentiment.`, 
});

const summarizeSentimentFlow = ai.defineFlow(
  {
    name: 'summarizeSentimentFlow',
    inputSchema: SummarizeSentimentInputSchema,
    outputSchema: SummarizeSentimentOutputSchema,
  },
  async input => {
    const {output} = await summarizeSentimentPrompt(input);
    return output!;
  }
);
