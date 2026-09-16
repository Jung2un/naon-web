import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col items-center justify-center px-4 text-center">
      <div className="flex size-[72px] items-center justify-center rounded-full border border-line bg-cream">
        <SearchX className="size-10 text-muted" strokeWidth={1.25} aria-hidden />
      </div>
      <h1 className="mt-5 font-display text-section font-semibold text-ink">
        없는 페이지예요
      </h1>
      <p className="mt-2 text-base text-muted">
        주소가 바뀌었거나 지워진 것 같아요.
      </p>
      <Button variant="primary" asChild className="mt-6">
        <Link href="/dashboard">대시보드로</Link>
      </Button>
    </main>
  );
}
