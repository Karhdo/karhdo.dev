import Bash from 'public/static/icons/bash.svg';
import Git from 'public/static/icons/git.svg';
import GitHub from 'public/static/icons/github.svg';
import Javascript from 'public/static/icons/javascript.svg';
import Liquid from 'public/static/icons/liquid.svg';
import Markdown from 'public/static/icons/markdown.svg';
import NextJS from 'public/static/icons/nextjs.svg';
import Node from 'public/static/icons/nodejs.svg';
import Prisma from 'public/static/icons/prisma.svg';
import Railway from 'public/static/icons/railway.svg';
import React from 'public/static/icons/react.svg';
import Remix from 'public/static/icons/remix.svg';
import Spotify from 'public/static/icons/spotify.svg';
import TailwindCSS from 'public/static/icons/tailwind.svg';
import Typescript from 'public/static/icons/typescript.svg';
import Umami from 'public/static/icons/umami.svg';
import Vercel from 'public/static/icons/vercel.svg';
import NestJS from 'public/static/icons/nestjs.svg';
import Docker from 'public/static/icons/docker.svg';
import Postgres from 'public/static/icons/postgres.svg';
import Mongodb from 'public/static/icons/mongodb.svg';

export const BrandIconsMap = {
  React,
  Remix,
  Git,
  GitHub,
  Javascript,
  Typescript,
  Node,
  Bash,
  Liquid,
  Markdown,
  NextJS,
  TailwindCSS,
  Prisma,
  Umami,
  Vercel,
  Railway,
  Spotify,
  NestJS,
  Docker,
  Postgres,
  Mongodb,
};

export type BrandIconType = keyof typeof BrandIconsMap;

const BrandIcon = (props: { type: keyof typeof BrandIconsMap; className?: string }) => {
  const { type, className } = props;

  const Icon = BrandIconsMap[type];

  if (!Icon) {
    return <div>Missing icon for {type}.</div>;
  }

  return <Icon className={className || 'h-16 w-16 lg:h-14 lg:w-14 xl:h-20 xl:w-20'} fill="currentColor" />;
};

export default BrandIcon;
