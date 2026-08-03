import ClientWorkspace from "@/components/clients/ClientWorkspace";

interface ClientPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientPage({
  params,
}: ClientPageProps) {
  const { id } = await params;

  return <ClientWorkspace clientId={id} />;
}