'use server';
/**
 * @fileOverview This file defines a Genkit flow for categorizing comments by sentiment.
 *
 * It includes:
 * - `categorizeCommentsBySentiment`:  A function that takes a list of comments and categorizes them based on their sentiment.
 * - `CategorizeCommentsInput`: The input type for the categorizeCommentsBySentiment function.
 * - `CategorizeCommentsOutput`: The output type for the categorizeCommentsBySentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CommentSchema = z.object({
  nome_usuario: z.string().describe('The username of the comment author.'),
  link_comentario: z.string().describe('The URL of the comment.'),
  texto: z.string().describe('The text content of the comment.'),
});

const CategorizeCommentsInputSchema = z.object({
  comments: z.array(CommentSchema).describe('An array of comments to analyze.'),
});

export type CategorizeCommentsInput = z.infer<typeof CategorizeCommentsInputSchema>;

const SentimentCategorySchema = z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']);

const CommentAnalysisSchema = CommentSchema.extend({
  sentimento: SentimentCategorySchema.describe('The sentiment of the comment (POSITIVE, NEUTRAL, or NEGATIVE).'),
  justificativa_curta: z.string().describe('A short justification for the sentiment.'),
  confianca: z.number().describe('The confidence score of the sentiment analysis (0-100).'),
});

export type CommentAnalysis = z.infer<typeof CommentAnalysisSchema>;

const SentimentTotalsSchema = z.object({
  positivos: z.number().describe('The number of positive comments.'),
  neutros: z.number().describe('The number of neutral comments.'),
  negativos: z.number().describe('The number of negative comments.'),
  total: z.number().describe('The total number of comments.'),
});

const CategorizeCommentsOutputSchema = z.object({
  resumo_geral: z.string().describe('A summary of the overall sentiment of the comments.'),
  totais: SentimentTotalsSchema.describe('The totals for each sentiment category.'),
  comentarios_analisados: z.array(CommentAnalysisSchema).describe('The analyzed comments with sentiment and justification.'),
});

export type CategorizeCommentsOutput = z.infer<typeof CategorizeCommentsOutputSchema>;

export async function categorizeCommentsBySentiment(input: CategorizeCommentsInput): Promise<CategorizeCommentsOutput> {
  return categorizeCommentsFlow(input);
}

const categorizeCommentsPrompt = ai.definePrompt({
  name: 'categorizeCommentsPrompt',
  input: {schema: CategorizeCommentsInputSchema},
  output: {schema: CategorizeCommentsOutputSchema},
  prompt: `You are an AI that analyzes the sentiment of comments and categorizes them as POSITIVE, NEUTRAL, or NEGATIVE.

Analyze the following comments and provide a summary of the overall sentiment. Also, provide a short justification for each comment's sentiment and a confidence score (0-100).

Comments:
{{#each comments}}
- Username: {{this.nome_usuario}}
  Comment: {{this.texto}}
{{/each}}
`,
});

const categorizeCommentsFlow = ai.defineFlow(
  {
    name: 'categorizeCommentsFlow',
    inputSchema: CategorizeCommentsInputSchema,
    outputSchema: CategorizeCommentsOutputSchema,
  },
  async input => {
    const {output} = await categorizeCommentsPrompt(input);
    return output!;
  }
);
