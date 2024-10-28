import type { NextRequest } from 'next/server';

import prisma from '@/servers/prisma.server';

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.pathname.split('/').pop();

    if (!slug) {
      return Response.json({ message: 'Slug is required' }, { status: 400 });
    }

    const views = await prisma.view.findUnique({
      where: { slug },
    });

    return Response.json({
      total: views?.count?.toString?.() || '0',
    });
  } catch (error) {
    return Response.json({ message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const slug = req.nextUrl.pathname.split('/').pop();

    if (!slug) {
      return Response.json({ message: 'Slug is required' }, { status: 400 });
    }

    const newOrUpdatedViews = await prisma.view.upsert({
      where: { slug },
      create: { slug },
      update: {
        count: {
          increment: 1,
        },
      },
    });

    return Response.json({
      total: newOrUpdatedViews.count.toString(),
    });
  } catch (error) {
    return Response.json({ message: (error as Error).message }, { status: 500 });
  }
}
