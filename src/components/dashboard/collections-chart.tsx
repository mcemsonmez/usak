"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type CollectionPoint = { date: string; expected: number; collected: number };

const config = {
  expected: { label: "Expected", color: "var(--chart-2)" },
  collected: { label: "Collected", color: "var(--chart-1)" },
} satisfies ChartConfig;

const czk = (v: number) =>
  new Intl.NumberFormat("en-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(v);
const short = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

/** Running totals: rent expected by due date vs money actually matched, by day. The gap is what is late. */
export function CollectionsChart({ data }: { data: CollectionPoint[] }) {
  const [range, setRange] = useState("90");
  const shown = useMemo(() => data.slice(-Number(range)), [data, range]);
  const last = shown.at(-1);
  const gap = last ? last.expected - last.collected : 0;

  return (
    <Card className="@container/chart">
      <CardHeader>
        <CardTitle>Rent expected vs collected</CardTitle>
        <CardDescription>
          Running total since {shown[0] ? short(shown[0].date) : "the first charge"}.{" "}
          {gap > 0 ? `${czk(gap)} expected but not in yet.` : "Everything due is in."}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(v) => v && setRange(v)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="90">3 months</ToggleGroupItem>
            <ToggleGroupItem value="30">30 days</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
          <AreaChart data={shown} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-collected)" stopOpacity={0.55} />
                <stop offset="95%" stopColor="var(--color-collected)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fillExpected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-expected)" stopOpacity={0.18} />
                <stop offset="95%" stopColor="var(--color-expected)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeOpacity={0.4} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={36}
              tickFormatter={short}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              domain={[
                (min: number) => Math.max(0, Math.floor((min * 0.85) / 10000) * 10000),
                "auto",
              ]}
              tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            />
            <ChartTooltip
              cursor={{ strokeOpacity: 0.3 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => short(String(v))}
                  formatter={(value, name) => (
                    <span className="flex w-full justify-between gap-6">
                      <span className="text-muted-foreground">
                        {config[name as keyof typeof config]?.label}
                      </span>
                      <span className="font-mono tabular-nums">{czk(Number(value))}</span>
                    </span>
                  )}
                  indicator="line"
                />
              }
            />
            <Area
              dataKey="expected"
              type="stepAfter"
              stroke="var(--color-expected)"
              strokeDasharray="4 4"
              strokeWidth={2}
              fill="url(#fillExpected)"
              animationDuration={900}
            />
            <Area
              dataKey="collected"
              type="stepAfter"
              stroke="var(--color-collected)"
              strokeWidth={2}
              fill="url(#fillCollected)"
              animationDuration={1200}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
