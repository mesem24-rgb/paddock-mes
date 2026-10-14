import CreateProjectForm from "@/components/projects/CreateProjectForm";

export const metadata = { title: "New Project" };

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string | string[] }>;
}) {
  const params = await searchParams;
  const client = typeof params.client === "string" ? params.client : "";
  return (
    <div className="mx-auto max-w-[1400px]">
      <CreateProjectForm initialClientName={client} />
    </div>
  );
}
