import { ArrowLeft, FolderX } from "lucide-react";
import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9eae4] text-[#60645c]">
          <FolderX size={26} />
        </div>

        <h1 className="mt-5 text-2xl font-semibold text-[#20231f]">
          Project not found
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#777b73]">
          This project may have been removed, renamed, or the address may be
          incorrect.
        </p>

        <Link
          href="/projects"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#171918] px-4 py-3 text-sm font-medium text-white"
        >
          <ArrowLeft size={17} />
          Return to projects
        </Link>
      </div>
    </div>
  );
}