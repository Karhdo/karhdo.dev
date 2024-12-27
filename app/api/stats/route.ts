import type { NextRequest } from 'next/server';

import type { Stats, StatsType } from '@prisma/client';

import prisma from '@/servers/prisma.server';

const getBlogStats = async (slug: string, type: StatsType): Promise<Stats> => {
  let result: Stats | null;

  result = await prisma.stats.findUnique({
    where: {
      type_slug: { slug, type },
    },
  });

  if (!result) {
    result = await prisma.stats.create({
      data: { type, slug },
    });
  }

  return result;
};

const updateBlogStats = async (type: StatsType, slug: string, updates: Partial<Stats>): Promise<Stats> => {
  const currentStats = await getBlogStats(slug, type);

  // Safeguard against negative updates
  for (const key in updates) {
    if (typeof updates[key] === 'number' && updates[key] < currentStats[key]) {
      updates[key] = currentStats[key];
    }
  }

  const updated = await prisma.stats.update({
    where: {
      type_slug: { slug, type },
    },
    data: updates,
  });

  return updated;
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

export async function POST(request: NextRequest) {
  try {
    const data: Stats = await request.json();

    const { slug, type, ...updates } = data;

    if (!slug || !type) {
      return Response.json({ message: 'Missing `type` or `slug` parameter!' }, { status: 400 });
    }

    const updated = await updateBlogStats(type, slug, updates);

    return Response.json(updated);
  } catch (error) {
    console.error(error);

    return Response.json({ message: 'Internal Server Error!' }, { status: 500 });
  }
}
