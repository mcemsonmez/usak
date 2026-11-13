import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { PostHogProvider } from "@/components/posthog-provider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "usak",
  description:
    "Rent collection for Prague landlords: bank statements matched to leases, AI lease import, debtors and repairs in one place.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const light = (await cookies()).get("theme")?.value === "light";
  return (
    <html
      lang="en"
      className={[geistSans.variable, geistMono.variable, light && "theme-light"]
        .filter(Boolean)
        .join(" ")}
    >
      <body className="antialiased" suppressHydrationWarning>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
