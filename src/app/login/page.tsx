import type { Metadata } from "next";
import { OAuthButtons } from "@/components/app/OAuthButtons";
import { safeNextPath } from "@/lib/site-url";
import { humanError } from "@/lib/errors";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(
    typeof params.next === "string" ? params.next : undefined,
  );
  const errorCode = typeof params.error === "string" ? params.error : null;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-14">
      <div className="w-full max-w-[380px]">
        <h1 className="font-display text-title font-semibold text-ink">AI 대역</h1>
        <p className="mt-2 text-base text-body">
          내 대신 연기하는 캐릭터를 만들고, 찍은 영상을 바꿔 둘 곳이에요.
        </p>

        <div className="mt-8">
          <OAuthButtons next={next} />
        </div>

        {errorCode && (
          <p role="alert" className="mt-4 text-caption text-danger">
            {humanError(errorCode)}
          </p>
        )}

        <p className="mt-6 text-caption text-muted">
          계속하면 서비스 이용약관과 개인정보 처리방침에 동의하는 것으로 봐요.
        </p>
      </div>
    </main>
  );
}
