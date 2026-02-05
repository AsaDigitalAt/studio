// src/ai/flows/improve-caption.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for improving Instagram captions to elicit a more positive sentiment.
 *
 * It includes:
 * - `improveCaption`: A function to generate improved caption suggestions based on the original caption and sentiment analysis.
 * - `ImproveCaptionInput`: The input type for the `improveCaption` function, including the original caption and sentiment summary.
 * - `ImproveCaptionOutput`: The output type for the `improveCaption` function, providing a list of suggested captions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the improveCaption flow
const ImproveCaptionInputSchema = z.object({
  originalCaption: z
    .string()
    .describe('The original Instagram caption that needs improvement.'),
  sentimentSummary: z
    .string()
    .describe(
      'A summary of the sentiment analysis of the comments on the post.'
    ),
});

export type ImproveCaptionInput = z.infer<typeof ImproveCaptionInputSchema>;

// Define the output schema for the improveCaption flow
const ImproveCaptionOutputSchema = z.object({
  suggestedCaptions: z
    .array(z.string())
    .describe('An array of suggested improved captions.'),
});

export type ImproveCaptionOutput = z.infer<typeof ImproveCaptionOutputSchema>;

// Define the improveCaption function that calls the flow
export async function improveCaption(input: ImproveCaptionInput): Promise<ImproveCaptionOutput> {
  return improveCaptionFlow(input);
}

// Define the prompt to generate improved caption suggestions
const improveCaptionPrompt = ai.definePrompt({
  name: 'improveCaptionPrompt',
  input: {schema: ImproveCaptionInputSchema},
  output: {schema: ImproveCaptionOutputSchema},
  prompt: `You are an expert social media manager.

  Given an original Instagram caption and a summary of the sentiment of the comments on the post, generate three alternative captions that are likely to elicit a more positive reaction.

  Original Caption: {{{originalCaption}}}
  Sentiment Summary: {{{sentimentSummary}}}

  Provide the captions in a numbered list.

  Example:
  1. [Improved Caption 1]
  2. [Improved Caption 2]
  3. [Improved Caption 3]`,
});

// Define the Genkit flow for improving the caption
const improveCaptionFlow = ai.defineFlow(
  {
    name: 'improveCaptionFlow',
    inputSchema: ImproveCaptionInputSchema,
    outputSchema: ImproveCaptionOutputSchema,
  },
  async input => {
    const {output} = await improveCaptionPrompt(input);
    return output!;
  }
);
