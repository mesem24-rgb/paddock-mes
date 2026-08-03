export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f0] px-4">
      <section className="w-full max-w-md rounded-2xl border border-[#dedfd9] bg-white p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#858981]">
          Paddock
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#20231f]">
          Sign in
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#71756e]">
          Authentication will be connected when Supabase is added.
        </p>
      </section>
    </main>
  );
}