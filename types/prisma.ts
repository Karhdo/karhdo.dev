import { $Enums, Stats as StatsClient } from '@/prisma/generated/client';

export type Stats = StatsClient;

export type StatsType = $Enums.StatsType;
export const StatsTypeEnum = $Enums.StatsType;
