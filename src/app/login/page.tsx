import type { Metadata } from "next";
import { OAuthButtons } from "@/components/app/OAuthButtons";
import { safeNextPath } from "@/lib/site-url";
import { humanError } from "@/lib/errors";
import { BrandMark } from "@/components/app/BrandMark";
export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(
    typeof params.next === "string" ? params.next : undefined,
  );
  const errorCode = typeof params.error === "string" ? params.error : null;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-[460px] rounded-[28px] border border-line bg-surface p-6 sm:p-10">
        <BrandMark size="lg" />
        <h1 className="mt-6 font-display text-title font-semibold text-ink">
          또 다른 나, 세상에 나오다.
        </h1>
        <p className="mt-2 text-base text-body">
          나온에서 얼굴상·헤어·분위기를 직접 고르고, 눈·코·눈썹까지 다듬어보세요. 완성한 캐릭터로 직접 찍은 영상 속 내 모습을 바꿀 수 있어요.
        </p>

        <ol className="mt-6 space-y-3 rounded-[16px] bg-cream p-4 text-sm text-body">{["내 취향을 담은 캐릭터 만들기", "직접 찍은 짧은 영상 올리기", "캐릭터로 변환하고 결과 확인하기"].map((text,i)=><li key={text} className="flex gap-3"><span className="font-semibold text-primary">0{i+1}</span>{text}</li>)}</ol>
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
