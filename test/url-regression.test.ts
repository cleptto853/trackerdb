import test from 'node:test';
import assert from 'node:assert/strict';
import { safeParse, ParseError } from '../lib/url-parse.js';

/**
 * URL Regression Test Suite
 * Tests critical URLs across PSL edge cases, IDNs, IPs, localhost, ports, trailing dots, etc.
 * Ensures safeParse handles known tricky cases correctly.
 */

test('URL Regression Suite', async (t) => {
  /**
   * Test URLs with expected outcomes
   * Format: { url, shouldBeValid, description }
   */
  const testCases = [
    // Standard public domains
    {
      url: 'https://www.google.com',
      shouldBeValid: true,
      description: 'Standard public domain',
    },
    {
      url: 'https://github.com',
      shouldBeValid: true,
      description: 'GitHub domain',
    },
    {
      url: 'http://example.com',
      shouldBeValid: true,
      description: 'HTTP public domain',
    },

    // Subdomains
    {
      url: 'https://subdomain.example.org',
      shouldBeValid: true,
      description: 'Subdomain of public suffix',
    },
    {
      url: 'https://a.b.c.example.co.uk',
      shouldBeValid: true,
      description: 'Multi-level subdomain with compound PSL',
    },

    // Multi-level public suffixes (known PSL edge cases)
    {
      url: 'https://example.co.uk',
      shouldBeValid: true,
      description: 'co.uk PSL entry',
    },
    {
      url: 'https://example.ac.uk',
      shouldBeValid: true,
      description: 'ac.uk PSL entry',
    },
    {
      url: 'https://example.gov.uk',
      shouldBeValid: true,
      description: 'gov.uk PSL entry',
    },
    {
      url: 'https://example.blogspot.com',
      shouldBeValid: true,
      description: 'blogspot.com PSL entry (Google-owned suffix)',
    },

    // International Domain Names (IDN / Punycode)
    {
      url: 'https://xn--e28h.jp',
      shouldBeValid: true,
      description: 'Punycode IDN domain',
    },
    {
      url: 'https://münchen.de',
      shouldBeValid: true,
      description: 'Unicode IDN domain',
    },

    // IPs and localhost (should be private/invalid)
    {
      url: 'http://127.0.0.1',
      shouldBeValid: false,
      description: 'Localhost IP (private)',
    },
    {
      url: 'http://192.168.1.1',
      shouldBeValid: false,
      description: 'Private IP range (private)',
    },
    {
      url: 'http://10.0.0.1',
      shouldBeValid: false,
      description: 'Private IP class A (private)',
    },
    {
      url: 'http://localhost',
      shouldBeValid: false,
      description: 'localhost name (private)',
    },

    // Ports
    {
      url: 'https://example.com:8080',
      shouldBeValid: true,
      description: 'Domain with non-standard port',
    },
    {
      url: 'https://example.com:443',
      shouldBeValid: true,
      description: 'Domain with standard HTTPS port',
    },

    // Trailing dots (FQDN notation)
    {
      url: 'https://example.com.',
      shouldBeValid: true,
      description: 'Domain with trailing dot (FQDN)',
    },

    // Paths and query strings (should still extract domain)
    {
      url: 'https://example.com/path/to/page',
      shouldBeValid: true,
      description: 'Domain with path',
    },
    {
      url: 'https://example.com?query=value',
      shouldBeValid: true,
      description: 'Domain with query string',
    },
    {
      url: 'https://example.com/path?query=value#fragment',
      shouldBeValid: true,
      description: 'Domain with path, query, and fragment',
    },

    // Edge cases with special characters in paths (valid URLs)
    {
      url: 'https://example.com/path%20with%20spaces',
      shouldBeValid: true,
      description: 'Domain with URL-encoded spaces',
    },

    // Unusual but valid TLDs
    {
      url: 'https://example.io',
      shouldBeValid: true,
      description: '.io TLD',
    },
    {
      url: 'https://example.ai',
      shouldBeValid: true,
      description: '.ai TLD',
    },
    {
      url: 'https://example.museum',
      shouldBeValid: true,
      description: 'Longer TLD (.museum)',
    },

    // Real-world edge cases
    {
      url: 'https://www.bbc.co.uk',
      shouldBeValid: true,
      description: 'BBC with .co.uk PSL',
    },
    {
      url: 'https://www.parliament.uk',
      shouldBeValid: true,
      description: 'UK Parliament with .uk PSL',
    },
  ];

  await t.test('Valid public URLs return isValid=true', async (t) => {
    const validCases = testCases.filter((tc) => tc.shouldBeValid);

    for (const testCase of validCases) {
      await t.test(testCase.description, () => {
        const result = safeParse(testCase.url);
        assert.strictEqual(result.isValid, true, testCase.url);
        assert.ok(result.domain, `domain should exist for ${testCase.url}`);
        assert.ok(
          result.publicSuffix,
          `publicSuffix should exist for ${testCase.url}`,
        );
      });
    }
  });

  await t.test('Invalid/private URLs return isValid=false', async (t) => {
    const invalidCases = testCases.filter((tc) => !tc.shouldBeValid);

    for (const testCase of invalidCases) {
      await t.test(testCase.description, () => {
        const result = safeParse(testCase.url);
        assert.strictEqual(result.isValid, false, testCase.url);
      });
    }
  });

  await t.test('All results have correct shape', async (t) => {
    for (const testCase of testCases) {
      await t.test(`Result shape for: ${testCase.description}`, () => {
        const result = safeParse(testCase.url);

        // Validate result shape
        assert.strictEqual(typeof result.url, 'string');
        assert.ok(
          result.domain === null || typeof result.domain === 'string',
        );
        assert.ok(
          result.publicSuffix === null || typeof result.publicSuffix === 'string',
        );
        assert.strictEqual(typeof result.isPrivate, 'boolean');
        assert.strictEqual(typeof result.isValid, 'boolean');
      });
    }
  });

  await t.test('Invalid inputs throw ParseError', async (t) => {
    const invalidInputs = [
      { input: '', description: 'Empty string' },
      { input: '   ', description: 'Whitespace only' },
      { input: 'example.com', description: 'No scheme' },
      { input: 'ftp://example.com', description: 'Unsupported scheme (ftp)' },
      {
        input: 'https://' + 'x'.repeat(2100),
        description: 'Exceeds max length',
      },
      { input: 123, description: 'Non-string input (number)' },
      { input: null, description: 'Null input' },
      { input: undefined, description: 'Undefined input' },
    ];

    for (const { input, description } of invalidInputs) {
      await t.test(`Rejects: ${description}`, () => {
        assert.throws(
          () => safeParse(input),
          ParseError,
          `Should throw ParseError for: ${description}`,
        );
      });
    }
  });
});