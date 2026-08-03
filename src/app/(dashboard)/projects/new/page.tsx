import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "New Project",
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#6f736c] hover:text-[#20231f]"
      >
        <ArrowLeft size={17} />
        Back to projects
      </Link>

      <div className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#858981]">
          New build
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#20231f]">
          Create project
        </h1>

        <p className="mt-2 text-[#71756e]">
          Set up the client, scope, timeline, budget, and development details.
        </p>
      </div>

      <section className="mt-8 rounded-2xl border border-[#dedfd9] bg-white p-6">
        <p className="text-sm text-[#777b73]">
          The project creation form will be built next.
        </p>
      </section>
    </div>
  );
}