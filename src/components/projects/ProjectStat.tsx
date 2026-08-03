import type { LucideIcon } from "lucide-react";

interface ProjectStatProps {
  label: string;
  value: string;
  icon: LucideIcon;
  supportingText?: string;
}

export default function ProjectStat({
  label,
  value,
  icon: Icon,
  supportingText,
}: ProjectStatProps) {
  return (
    <article className="rounded-2xl border border-[#dedfd9] bg-white p-5">
      <div className="flex items-center gap-2 text-[#7b7f77]">
        <Icon size={17} />
        <p className="text-sm font-medium">{label}</p>
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight text-[#20231f]">
        {value}
      </p>

      {supportingText && (
        <p className="mt-2 text-xs text-[#8d9189]">{supportingText}</p>
      )}
    </article>
  );
}