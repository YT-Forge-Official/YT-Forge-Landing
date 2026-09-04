import { REPO_URL, VERSION, LATEST_URL, AUTHOR } from '@/lib/site';
import { SITE_URL } from '@/lib/seo';

/*
  JSON-LD: the page's facts written out in a vocabulary search engines parse
  directly, instead of being inferred from prose they may read wrong.

  Three linked nodes, joined by @id so they read as one graph rather than
  three unrelated blobs:

    SoftwareApplication  what the product IS — platforms, price, licence.
                         This is the node that earns an app-style rich result
                         (price and rating shown under the link).
    WebSite              what the domain is, and its canonical name.
    Organization         who publishes it, tied to the GitHub org so Google
                         can connect the site to the account behind it.

  `offers` with price "0" is not decoration: a free price is a fact Google
  displays, and omitting it means the result stays a plain blue link.

  Everything here is derived from lib/site.js, so a version bump or a repo
  move updates the markup too — structured data that contradicts the visible
  page is worse than none at all.
*/
export function StructuredData({ stats }) {
  const graph = [
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'YT-FORGE',
      applicationCategory: 'MultimediaApplication',
      applicationSubCategory: 'Video Downloader',
      operatingSystem: 'macOS, Windows, Linux',
      softwareVersion: VERSION,
      url: SITE_URL,
      downloadUrl: LATEST_URL,
      installUrl: LATEST_URL,
      softwareHelp: `${REPO_URL}#readme`,
      license: `${REPO_URL}/blob/main/LICENSE`,
      isAccessibleForFree: true,
      description:
        'A fast, open-source desktop YouTube downloader that prefers H.264 + AAC, so files drop straight onto a Premiere, Final Cut or Resolve timeline.',
      featureList: [
        'H.264 + AAC by default for editor-ready files',
        'Built-in ffmpeg conversion from VP9 and AV1',
        'Playlist batch downloads with per-item progress',
        'Up to 8K UHD, no ads and no tracking',
      ],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@id': `${SITE_URL}/#org` },
      publisher: { '@id': `${SITE_URL}/#org` },
      // Only claimed when GitHub actually answered — an interaction count
      // invented at build time would be a lie search engines can check.
      ...(typeof stats?.downloads === 'number' && stats.downloads > 0
        ? {
            interactionStatistic: {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/DownloadAction',
              userInteractionCount: stats.downloads,
            },
          }
        : {}),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'YT-FORGE',
      inLanguage: 'en',
      publisher: { '@id': `${SITE_URL}/#org` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      name: 'YT-Forge',
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      sameAs: [REPO_URL, 'https://github.com/YT-Forge-Official'],
      founder: { '@type': 'Person', name: AUTHOR.name },
    },
  ];

  return (
    <script
      type="application/ld+json"
      // The payload is our own data, never user input. JSON.stringify escapes
      // the quotes; the `<` guard closes the one XSS hole a JSON-LD block can
      // have, where a string containing "</script>" would end the tag early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(
          /</g,
          '\\u003c',
        ),
      }}
    />
  );
}
