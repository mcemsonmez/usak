"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

const config = { occupied: { label: "Occupied", color: "var(--chart-1)" } } satisfies ChartConfig;

export function OccupancyChart({
  occupied,
  total,
  byProperty,
}: {
  occupied: number;
  total: number;
  byProperty: { name: string; occupied: number; total: number }[];
}) {
  const pct = total ? Math.round((occupied / total) * 100) : 0;
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Occupancy</CardTitle>
        <CardDescription>
          {occupied} of {total} units let
        </CardDescription>
      </CardHeader>
      <CardContent className="relative grid place-items-center">
        <ChartContainer config={config} className="aspect-square h-[190px]">
          <RadialBarChart
            data={[{ occupied: pct }]}
            innerRadius="72%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="occupied"
              background={{ fill: "var(--track)" }}
              cornerRadius={12}
              fill="var(--color-occupied)"
              animationDuration={1200}
            />
          </RadialBarChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="font-mono text-4xl font-semibold tracking-tight tabular-nums">
            {pct}%
          </span>
          <span className="text-muted-foreground text-xs">let</span>
        </div>
        <ul className="mt-4 grid w-full gap-2.5">
          {byProperty.map((p) => (
            <li key={p.name} className="grid gap-1.5">
              <div className="flex justify-between text-xs">
                <span>{p.name}</span>
                <span className="text-muted-foreground font-mono tabular-nums">
                  {p.occupied}/{p.total}
                </span>
              </div>
              <div className="bg-track h-1.5 overflow-hidden rounded-full">
                <div
                  className="grow-x bg-lime h-full rounded-full"
                  style={{ width: `${(p.occupied / p.total) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
