import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`
      CREATE TABLE IF NOT EXISTS downloads_history (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        release_tag VARCHAR(255) NOT NULL,
        distribution_name VARCHAR(255) NOT NULL,
        download_count INTEGER NOT NULL
      );
    `;
    return NextResponse.json({ success: true, message: "Table created successfully!", result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
