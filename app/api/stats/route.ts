import type { NextRequest } from 'next/server';

import type { Stats, StatsType } from '@/types/prisma';

import prisma from '@/lib/services/prisma';

// v1 is a read-only archive: stats are shared with v2 (karhdo.dev), which records every view and reaction.
const getBlogStats = async (slug: string, type: StatsType): Promise<Stats> => {
  const result = await prisma.stats.findUnique({
    where: {
      type_slug: { slug, type },
    },
  });

  return result ?? { type, slug, views: 0, loves: 0, applauses: 0, ideas: 0, bullseye: 0 };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams: params } = new URL(request.url);

    const slug = params.get('slug');
    const type = params.get('type') as StatsType;

    if (!slug || !type) {
      return new Response(JSON.stringify({ message: 'Missing or invalid `type` or `slug` parameter!' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBlogStats(slug, type);

    return Response.json(data);
  } catch (error) {
    console.error(error);

    return Response.json({ message: 'Internal Server Error!' }, { status: 500 });
  }
}

export async function POST() {
  return Response.json(
    { message: 'Stats are read-only on v1. Views and reactions are recorded on https://karhdo.dev.' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}
