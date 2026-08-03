import ProjectWorkspace from "@/components/projects/ProjectWorkspace";

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;

  return <ProjectWorkspace projectId={id} />;
}