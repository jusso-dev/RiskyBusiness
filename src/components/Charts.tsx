"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";

const palette = ["oklch(0.50 0.11 178)", "oklch(0.62 0.13 76)", "oklch(0.55 0.15 28)", "oklch(0.47 0.10 250)", "oklch(0.56 0.11 145)"];

export function SimpleBarChart({ data, xKey, yKey }: { data: Record<string, string | number>[]; xKey: string; yKey: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: -20, right: 12, top: 12, bottom: 4 }}>
        <CartesianGrid stroke="oklch(0.84 0.018 170)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey={yKey} radius={[5, 5, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={palette[index % palette.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleLineChart({ data, xKey, yKey }: { data: Record<string, string | number>[]; xKey: string; yKey: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ left: -20, right: 12, top: 12, bottom: 4 }}>
        <CartesianGrid stroke="oklch(0.84 0.018 170)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line type="monotone" dataKey={yKey} stroke="oklch(0.45 0.12 178)" strokeWidth={3} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RiskScatter({ data }: { data: Record<string, string | number>[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ left: -14, right: 12, top: 12, bottom: 4 }}>
        <CartesianGrid stroke="oklch(0.84 0.018 170)" />
        <XAxis dataKey="affordability" name="Affordability" tick={{ fontSize: 12 }} />
        <YAxis dataKey="creditHistory" name="Credit history" tick={{ fontSize: 12 }} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={data} fill="oklch(0.45 0.12 178)" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
