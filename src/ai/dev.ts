import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-comments-by-sentiment.ts';
import '@/ai/flows/improve-caption.ts';
import '@/ai/flows/summarize-sentiment.ts';