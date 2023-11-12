import type { NextApiRequest, NextApiResponse } from 'next';

import prisma from '@/libs/prisma.server';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const totalViews = await prisma.view.aggregate({
      _sum: {
        count: true,
      },
    });

    return res.status(200).json({ total: totalViews._sum.count?.toString?.() || 0 });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
