import { Sidebar } from "@/components/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_minmax(0,1fr)]">
      <Sidebar />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
