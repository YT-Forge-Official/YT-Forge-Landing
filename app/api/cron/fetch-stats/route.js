import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // 1. Verify Vercel Cron Token (Highly recommended in production)
  // You need to set CRON_SECRET in your Vercel Environment Variables
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Fetch releases from GitHub API
    // Replace with your actual GitHub username and repo
    const owner = 'your-github-username'; // TODO: Replace
    const repo = 'your-github-repo'; // TODO: Replace
    
    // We fetch the releases
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Optional: If you face rate limits, add a Personal Access Token
        // 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` 
      },
      cache: 'no-store' // Do not cache this request
    });

    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }

    const releases = await res.json();
    const timestamp = new Date().toISOString();
    let insertedRows = 0;

    // 3. Iterate over releases and their assets to extract download counts
    for (const release of releases) {
      const releaseTag = release.tag_name;
      
      for (const asset of release.assets) {
        const distributionName = asset.name;
        const downloadCount = asset.download_count;

        // 4. Insert into Vercel Postgres
        await sql`
          INSERT INTO downloads_history (timestamp, release_tag, distribution_name, download_count)
          VALUES (${timestamp}, ${releaseTag}, ${distributionName}, ${downloadCount})
        `;
        insertedRows++;
      }
    }

    return NextResponse.json({ success: true, message: `Successfully inserted ${insertedRows} records at ${timestamp}` });
  } catch (error) {
    console.error('Error fetching/saving stats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
