import type { NextApiRequest, NextApiResponse } from 'next';

import prisma from '@/libs/prisma.server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const slug = req.query.slug.toString();

    if (req.method === 'POST') {
      const newOrUpdatedViews = await prisma.view.upsert({
        where: { slug },
        create: { slug },
        update: {
          count: {
            increment: 1,
          },
        },
      });

      return res.status(200).json({
        total: newOrUpdatedViews.count.toString(),
      });
    }

    if (req.method === 'GET') {
      const views = await prisma.view.findUnique({
        where: { slug },
      });

      return res.status(200).json({
        total: views?.count?.toString?.() || 0,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}
