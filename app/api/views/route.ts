import { NextResponse } from 'next/server';

import prisma from '@/servers/prisma.server';

export async function GET() {
  try {
    const totalViews = await prisma.view.aggregate({
      _sum: {
        count: true,
      },
    });

    return NextResponse.json({ total: totalViews._sum.count?.toString?.() || '0' });
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
