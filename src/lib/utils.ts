import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AnalysisResult, LinkType } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const sanitizeUsername = (raw: string): string => {
  return raw.trim().toLowerCase().replace(/[^a-z0-9._]/g, '').replace(/^@/, '');
};

const extractMentions = (text: string): string[] => {
  const regex = /@([a-zA-Z0-9._]+)/g;
  const matches = text.match(regex);
  if (!matches) return [];
  return matches.map(sanitizeUsername);
};

export const analyzeLink = (url: string, optionalText: string = ''): Omit<AnalysisResult, 'sentimentData'> => {
  let normalizedUrl = url.trim();
  let type: LinkType = 'unknown';
  const warnings: string[] = [];
  const suggestions = new Set<string>();

  try {
    const urlObj = new URL(normalizedUrl);
    if (!urlObj.hostname.includes('instagram.com')) {
      throw new Error('Domínio inválido');
    }
    urlObj.search = ''; 
    normalizedUrl = urlObj.toString();
  } catch (e) {
    return { sourceType: 'unknown', normalizedUrl, suggestedUsernames: [], warnings: ['URL inválida'] };
  }

  if (normalizedUrl.includes('/reel/')) type = 'reel';
  else if (normalizedUrl.includes('/p/')) type = 'post';
  else if (normalizedUrl.includes('/stories/')) type = 'story';
  else if (normalizedUrl.match(/instagram\.com\/[a-zA-Z0-9._]+\/?$/)) type = 'profile';

  extractMentions(optionalText).forEach(u => suggestions.add(u));

  if (type === 'profile') {
    const match = normalizedUrl.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
    if (match && match[1] && !['p', 'reel', 'tv', 'stories', 'explore'].includes(match[1])) {
      suggestions.add(sanitizeUsername(match[1]));
    }
  }
  
  return {
    sourceType: type,
    normalizedUrl,
    suggestedUsernames: Array.from(suggestions),
    warnings
  };
};
