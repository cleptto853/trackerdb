import path from 'node:path';
import { readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { safeParse } from '../lib/url-parse.js';

export const SPEC_FILE_EXTENSION = '.eno';

export function isSpecFile(file: string): boolean {
  return path.extname(file) === SPEC_FILE_EXTENSION;
}

export const CATEGORIES = readdirSync('./db/categories')
  .filter((file) => path.extname(file) === SPEC_FILE_EXTENSION)
  .map((file) => path.basename(file, SPEC_FILE_EXTENSION));

export const ORGANIZATIONS = readdirSync('./db/organizations')
  .filter((file) => path.extname(file) === SPEC_FILE_EXTENSION)
  .map((file) => path.basename(file, SPEC_FILE_EXTENSION));

/**
 * Validates a URL using the safe parse wrapper.
 * Throws an assertion error if the URL is not valid or is not a public domain.
 *
 * @param url - The URL to validate
 * @throws {AssertionError} if URL is invalid or private
 */
export const assertUrl = (url: string): void => {
  const parsed = safeParse(url);
  assert(
    parsed.isValid,
    `\${url} is not a valid url or website is not public`,
  );
  assert(url.startsWith('http'), `\${url} does not start with http`);
};

/**
 * Partitions an array into two based on a predicate function.
 *
 * @param arr - The array to partition
 * @param pred - The predicate function
 * @returns A tuple of [matches, rest]
 */
export function partition<T>(
  arr: T[],
  pred: (item: T) => boolean,
): [T[], T[]] {
  const matches: T[] = [];
  const rest: T[] = [];

  for (const x of arr) {
    if (pred(x)) {
      matches.push(x);
    } else {
      rest.push(x);
    }
  }
  return [matches, rest];
}