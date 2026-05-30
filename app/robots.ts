import type { MetadataRoute } from 'next';

const SITE_URL = 'https://mokuresearch.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Lock crawlers out of authenticated / private surfaces.
        disallow: ['/dashboard', '/dashboard/', '/auth', '/auth/', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
