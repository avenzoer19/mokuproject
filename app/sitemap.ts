import type { MetadataRoute } from 'next';

const SITE_URL = 'https://mokuresearch.com';

/**
 * Only public, indexable marketing routes belong here.
 * Authenticated app routes (/dashboard/*, /auth) are intentionally excluded —
 * they hold user data and carry no SEO value. See robots.ts for the matching
 * Disallow rules.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
