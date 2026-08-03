import CreateProjectForm from "@/components/projects/CreateProjectForm";

export const metadata = {
  title: "New Project",
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-[1400px]">
      <CreateProjectForm />
    </div>
  );
}