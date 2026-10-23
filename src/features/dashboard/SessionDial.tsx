
/**
 * The session as a dial: one arc per block, swept in proportion to its share
 * of the minutes, main work drawn heaviest.
 *
 * It answers "how long, and how much of that is real work" in one glance,
 * which a number alone cannot.
 */
const arc = (cx: number, cy: number, r: number, from: number, to: number): string => {
  const point = (angle: number) => [
    cx + r * Math.cos(((angle - 90) * Math.PI) / 180),
    cy + r * Math.sin(((angle - 90) * Math.PI) / 180),
  ];
  const [x0, y0] = point(from);
  const [x1, y1] = point(to);
  return `M ${x0!.toFixed(2)} ${y0!.toFixed(2)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1!.toFixed(2)} ${y1!.toFixed(2)}`;
};

interface Block {
  name: string;
  minutes: number;
}

export const SessionDial = ({
  blocks,
  total,
  size = 104,
}: {
  blocks: Block[];
  total: number;
  size?: number;
}) => {
  const centre = size / 2;
  const radius = centre - 4;

  // Each block's arc, laid out end to end. Built before the render rather
  // than accumulated during it, so nothing is reassigned mid-render.
  const arcs = blocks.reduce<{ name: string; from: number; to: number }[]>((placed, block) => {
    const start = placed.at(-1)?.to ?? 0;
    const sweep = total === 0 ? 0 : (block.minutes / total) * 360;
    return [...placed, { name: block.name, from: start, to: start + sweep }];
  }, []);

  return (
    <svg className="dial" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={centre} cy={centre} r={radius} fill="none" stroke="var(--color-divider)" strokeWidth="1" />
      {arcs.map((block, index) => {
        // A hairline gap between neighbours, so the blocks read as separate.
        const from = block.from + 4;
        const to = block.to - 4;
        if (to <= from) return null;

        return (
          <path
            key={block.name}
            d={arc(centre, centre, radius, from, to)}
            fill="none"
            stroke={index === 1 ? 'var(--color-accent)' : 'var(--color-accent-300)'}
            strokeWidth={index === 1 ? 3 : 2}
            strokeLinecap="round"
            pathLength={1}
            style={{ strokeDasharray: 1, animation: `draw .8s ${0.3 + index * 0.35}s cubic-bezier(.6,0,.2,1) both` }}
          />
        );
      })}
    </svg>
  );
};
