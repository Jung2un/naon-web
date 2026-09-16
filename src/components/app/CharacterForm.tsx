"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Check } from "lucide-react";
import { Stepper } from "./Stepper";
import { Button } from "@/components/ui/button";
import { Input, FieldError } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { humanError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { ANGLE_LABEL, REF_ANGLES, type RefAngle } from "@/types/models";

const STEPS = ["이름 짓기", "사진 5장", "확인"];
const COST = 2;

const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "이름을 적어 주세요.")
    .max(20, "20자 안으로 적어 주세요."),
});
type NameValues = z.infer<typeof nameSchema>;

type Shots = Partial<Record<RefAngle, File>>;

export function CharacterForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [shots, setShots] = useState<Shots>({});
  const [previews, setPreviews] = useState<Partial<Record<RefAngle, string>>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: "" },
  });

  const missing = REF_ANGLES.filter((angle) => !shots[angle]);
  const shotsComplete = missing.length === 0;

  function pickShot(angle: RefAngle, file: File | undefined) {
    if (!file) return;
    setShots((prev) => ({ ...prev, [angle]: file }));
    setPreviews((prev) => {
      if (prev[angle]) URL.revokeObjectURL(prev[angle]);
      return { ...prev, [angle]: URL.createObjectURL(file) };
    });
  }

  async function create() {
    if (!isSupabaseConfigured) {
      setError("아직 서버가 연결되지 않았어요.");
      return;
    }
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(humanError("SESSION_EXPIRED"));
        return;
      }

      // 레퍼런스 사진은 본인 폴더에만 올라간다 (Storage 정책이 강제한다)
      const folder = `${user.id}/${crypto.randomUUID()}`;
      const paths: Record<string, string> = {};

      for (const angle of REF_ANGLES) {
        const file = shots[angle];
        if (!file) continue;
        const path = `${folder}/${angle}`;
        const { error: uploadError } = await supabase.storage
          .from("characters")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;
        paths[angle] = path;
      }

      // 캐릭터 생성은 크레딧이 움직이므로 Edge Function을 거친다.
      // 클라이언트가 characters에 직접 INSERT 하지 않는다. — CLAUDE.md 아키텍처 규칙 2
      const { data, error: fnError } = await supabase.functions.invoke<{
        character_id: string;
      }>("create-character", {
        body: { name: getValues("name").trim(), refs: paths },
      });

      if (fnError) throw fnError;
      router.push(`/characters/${data?.character_id ?? ""}`);
      router.refresh();
    } catch (e) {
      const code =
        typeof e === "object" && e && "message" in e ? String(e.message) : null;
      setError(humanError(code));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-[720px]">
      <Stepper steps={STEPS} current={step} />

      <div className="mt-8">
        {step === 0 && (
          <form
            onSubmit={handleSubmit(() => setStep(1))}
            className="flex flex-col gap-2"
          >
            <Label htmlFor="name">캐릭터 이름</Label>
            <Input
              id="name"
              placeholder="기본 나"
              invalid={Boolean(errors.name)}
              autoFocus
              {...register("name")}
            />
            <FieldError>{errors.name?.message}</FieldError>
            <p className="text-caption text-muted">
              나중에 룩과 작업물을 고를 때 이 이름으로 찾게 돼요.
            </p>
            <div className="mt-4">
              <Button type="submit" variant="primary">
                다음
              </Button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div>
            <p className="text-base text-body">
              같은 자리에서 고개만 돌려 다섯 장을 찍어 주세요. 얼굴이 잘리지 않고
              밝은 곳일수록 결과가 좋아요.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {REF_ANGLES.map((angle) => (
                <label key={angle} className="block cursor-pointer">
                  <div
                    className={cn(
                      "relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-[12px] border bg-sunken transition-colors duration-150 ease-out",
                      shots[angle]
                        ? "border-line-strong"
                        : "border-line hover:border-line-strong",
                    )}
                  >
                    {previews[angle] ? (
                      // 사용자가 방금 고른 로컬 파일이라 next/image를 쓰지 않는다
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previews[angle]}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      <Upload
                        className="size-5 text-muted"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    )}
                    {shots[angle] && (
                      <span
                        className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-ink"
                        aria-hidden
                      >
                        <Check className="size-3 text-on-dark" strokeWidth={2.5} />
                      </span>
                    )}
                  </div>
                  <span className="mt-2 block text-caption text-ink">
                    {ANGLE_LABEL[angle]}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => pickShot(angle, e.target.files?.[0])}
                  />
                </label>
              ))}
            </div>

            {!shotsComplete && (
              <p className="mt-4 text-caption text-muted">
                {missing.map((a) => ANGLE_LABEL[a]).join(" · ")}이 아직 비어 있어요
              </p>
            )}

            <div className="mt-6 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(0)}>
                뒤로
              </Button>
              <Button
                variant="primary"
                disabled={!shotsComplete}
                onClick={() => setStep(2)}
              >
                다음
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <dl className="rounded-[12px] border border-line bg-cream p-5">
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <dt className="text-caption text-muted">이름</dt>
                <dd className="text-base text-ink">{getValues("name")}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                <dt className="text-caption text-muted">레퍼런스</dt>
                <dd className="text-base tabular text-ink">5각도</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 pt-3">
                <dt className="text-caption text-muted">소모 크레딧</dt>
                <dd className="text-base tabular text-ink">{COST}</dd>
              </div>
            </dl>

            <p className="mt-4 text-caption text-muted">
              만드는 데 1~3분 걸려요. 다 되면 캐릭터 목록에서 완료로 바뀌어요.
            </p>

            {error && (
              <p role="alert" className="mt-4 text-caption text-danger">
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={pending}>
                뒤로
              </Button>
              <Button variant="primary" onClick={create} disabled={pending}>
                {pending ? "만드는 중…" : "캐릭터 만들기"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
