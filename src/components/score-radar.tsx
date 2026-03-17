"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface ScoreRadarProps {
  returnScore: number;
  feeScore: number;
  sizeScore: number;
  actuarialScore: number;
  serviceScore: number;
  flexibilityScore: number;
  claimsScore: number;
  netFlowScore: number;
}

export function ScoreRadar({
  returnScore,
  feeScore,
  sizeScore,
  actuarialScore,
  serviceScore,
  flexibilityScore,
  claimsScore,
  netFlowScore,
}: ScoreRadarProps) {
  const data = [
    { metric: "תשואות", value: returnScore, fullMark: 100 },
    { metric: "ד\"נ חיצוניים", value: feeScore, fullMark: 100 },
    { metric: "גודל קרן", value: sizeScore, fullMark: 100 },
    { metric: "איזון אקטוארי", value: actuarialScore, fullMark: 100 },
    { metric: "שירות", value: serviceScore, fullMark: 100 },
    { metric: "זרימת כספים", value: netFlowScore, fullMark: 100 },
    { metric: "גמישות מסלולים", value: flexibilityScore, fullMark: 100 },
    { metric: "תביעות", value: claimsScore, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 10 }}
          tickCount={5}
        />
        <Radar
          name="ציון"
          dataKey="value"
          stroke="#eab308"
          fill="#eab308"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
