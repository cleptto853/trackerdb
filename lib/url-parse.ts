import { ParseError, ParseResult } from 'tldts-experimental';

export interface SafeParseResult {
    result: ParseResult | null;
    error: ParseError | null;
}

export function safeParse(url: string): SafeParseResult {
    try {
        const result = parseUrl(url);
        return { result, error: null };
    } catch (error) {
        return { result: null, error: error as ParseError };
    }
}

function parseUrl(url: string): ParseResult {
    // Add proper validation for URL format
    const parsed = /* logic to parse the URL with tldts-experimental */;
    if (!parsed) {
        throw new ParseError('Invalid URL');
    }
    return parsed;
}