import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { DashboardMetric } from "@/types";

interface MetricCardProps {
  metric: DashboardMetric;
}

export default function MetricCard({ metric }: MetricCardProps) {
  const TrendIcon =
    metric.trend === "up"
      ? ArrowUpRight
      : metric.trend === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <article className="rounded-2xl border border-[#dedfd9] bg-white p-5">
      <p className="text-sm font-medium text-[#767a73]">{metric.label}</p>

      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-3xl font-semibold tracking-tight text-[#20231f]">
          {metric.value}
        </p>

        <TrendIcon
          size={20}
          className={
            metric.trend === "up"
              ? "text-emerald-600"
              : metric.trend === "down"
                ? "text-orange-600"
                : "text-[#8d9189]"
          }
        />
      </div>

      {metric.change && (
        <p className="mt-3 text-xs text-[#8b8f87]">{metric.change}</p>
      )}
    </article>
  );
}