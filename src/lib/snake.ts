/**
 * Path for the GitHub heatmap snake: head for the nearest uneaten contribution, one cell per step,
 * eating whatever it passes over.
 */
export type Cell = { c: number; r: number };

/** `levels[column][row]`; a level above 0 is food. */
export function planSnake(levels: readonly (readonly number[])[], start: Cell = { c: 0, r: 0 }): Cell[] {
  const food = new Set<string>();
  levels.forEach((column, c) => {
    column.forEach((level, r) => {
      if (level > 0) food.add(`${c}:${r}`);
    });
  });

  const path: Cell[] = [];
  let head = { ...start };
  food.delete(`${head.c}:${head.r}`);

  while (food.size > 0) {
    let target: Cell | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const key of food) {
      const [c = 0, r = 0] = key.split(':').map(Number);
      const d = Math.abs(c - head.c) + Math.abs(r - head.r);
      if (d < best || (d === best && target && (c < target.c || (c === target.c && r < target.r)))) {
        best = d;
        target = { c, r };
      }
    }
    if (!target) break;
    while (head.c !== target.c || head.r !== target.r) {
      const dc = target.c - head.c;
      const dr = target.r - head.r;
      head =
        Math.abs(dc) >= Math.abs(dr)
          ? { c: head.c + Math.sign(dc), r: head.r }
          : { c: head.c, r: head.r + Math.sign(dr) };
      path.push(head);
      food.delete(`${head.c}:${head.r}`);
    }
  }
  return path;
}
