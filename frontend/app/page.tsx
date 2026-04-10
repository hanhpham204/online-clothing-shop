import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <div className="text-center">
        <h1 className="mb-3 text-3xl font-light uppercase tracking-[6px]">Luxury Fashion Collective</h1>
        <p className="mb-8 text-white/60">Home page placeholder</p>
        <Link
          href="/login"
          className="inline-flex h-11 items-center rounded-md border border-white/20 px-6 text-sm font-medium uppercase tracking-[1.6px] transition hover:bg-white/10"
        >
          Go to Login
        </Link>
      </div>
    </main>
  );
}
