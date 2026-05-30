import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Moku for Research',
    short_name: 'Moku',
    description:
      'Platform riset all-in-one berbasis AI untuk akademisi Indonesia — literatur, screening, terjemahan, data lab, dan penulisan manuskrip dalam satu workspace.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F1117',
    theme_color: '#0F1117',
    lang: 'id',
    categories: ['education', 'productivity', 'science'],
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
