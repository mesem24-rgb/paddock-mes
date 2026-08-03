import {
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  ReceiptText,
} from "lucide-react";
import type { Activity } from "@/types";

interface RecentActivityProps {
  activities: Activity[];
}

const activityIcons = {
  project: FolderKanban,
  task: BriefcaseBusiness,
  client: FileText,
  invoice: ReceiptText,
};

export default function RecentActivity({
  activities,
}: RecentActivityProps) {
  return (
    <section className="rounded-2xl border border-[#dedfd9] bg-white">
      <div className="border-b border-[#ecece6] px-5 py-4">
        <h2 className="font-semibold text-[#20231f]">Recent activity</h2>
        <p className="mt-1 text-xs text-[#858981]">
          Latest updates across your workspace
        </p>
      </div>

      <div className="divide-y divide-[#ecece6]">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type];

          return (
            <div key={activity.id} className="flex gap-3 px-5 py-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0f1eb] text-[#565a53]">
                <Icon size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-[#30332e]">
                  {activity.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-[#7c8078]">
                  {activity.description}
                </p>

                <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-[#a0a39c]">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}