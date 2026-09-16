import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, FieldError, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, MicroLabel } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Stepper } from "@/components/app/Stepper";
import { EmptyState } from "@/components/app/EmptyState";
import { CreditStrip } from "@/components/app/CreditStrip";
import { OAuthButton } from "@/components/app/OAuthButton";
import { OAUTH_PROVIDERS } from "@/lib/auth-providers";
import type { JobStatus } from "@/types/models";

export const metadata: Metadata = { title: "Kitchen Sink" };

const STATUSES: JobStatus[] = ["queued", "processing", "done", "failed"];

/** 토큰이 DESIGN.md 대로 자리잡았는지 한 화면에서 확인하는 곳. */
export default function KitchenSinkPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <h1 className="font-display text-title font-semibold">Kitchen Sink</h1>
      <p className="mt-2 max-w-[65ch] text-base text-body">
        DESIGN.md의 토큰과 컴포넌트를 한 화면에 모아 둔 곳이에요. 화면을 만들기
        전에 여기부터 맞춰요.
      </p>

      <Section title="색">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["크림 배경", "#f7f4ed"],
            ["가라앉은 표면", "#f0eee7"],
            ["차콜", "#1c1c1c"],
            ["보조 글자", "#5f5f5d"],
            ["테두리", "#eceae4"],
            ["상호작용 테두리", "rgba(28,28,28,0.4)"],
            ["호버", "rgba(28,28,28,0.04)"],
            ["실패", "#b3261e"],
          ].map(([name, hex]) => (
            <div key={name}>
              <div
                className="h-16 rounded-[12px] border border-line"
                style={{ background: hex }}
              />
              <p className="mt-2 text-caption text-ink">{name}</p>
              <p className="text-caption tabular text-muted">{hex}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="타이포그래피">
        <div className="space-y-3">
          <p className="font-display text-title font-semibold">
            페이지 제목 30px / 600 / -0.6px
          </p>
          <p className="font-display text-section font-semibold">
            섹션 제목 20px / 600 / -0.3px
          </p>
          <p className="text-card">카드 제목 16px / 400</p>
          <p className="text-base">본문 15px / 400 — 읽는 글은 65자쯤에서 끊어요.</p>
          <p className="text-sm">본문 작게 14px / 400</p>
          <p className="text-caption text-muted">캡션 13px / 400</p>
          <MicroLabel>라벨 11px / 600 / 0.08em</MicroLabel>
          <p className="font-display text-metric font-semibold tabular">1,240</p>
        </div>
      </Section>

      <Section title="버튼">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">캐릭터 만들기</Button>
          <Button variant="outline">충전</Button>
          <Button variant="ghost">전체 보기</Button>
          <Button variant="destructive">삭제</Button>
          <Button variant="primary" disabled>
            비활성
          </Button>
        </div>
      </Section>

      <Section title="OAuth 브랜드 버튼 — 색 규칙 면제">
        <div className="flex max-w-[380px] flex-col gap-3">
          {OAUTH_PROVIDERS.map((provider) => (
            <OAuthButton key={provider.id} provider={provider} />
          ))}
        </div>
        <p className="mt-3 max-w-[65ch] text-caption text-muted">
          공급자는 <code className="rounded-[4px] bg-sunken px-1">
            src/lib/auth-providers.ts
          </code>{" "}
          배열 하나에서 늘어나요. 카카오는 Supabase에서 켠 뒤 status를 ready로 바꾸면
          동작해요.
        </p>
      </Section>

      <Section title="상태 배지">
        <div className="flex flex-wrap items-center gap-3">
          {STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section title="카드">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>기본 카드</CardTitle>
            </CardHeader>
            <CardContent className="text-caption text-muted">
              그림자 없이 1px 테두리로만 담아요.
            </CardContent>
          </Card>
          <Card interactive>
            <CardHeader>
              <CardTitle>호버 카드</CardTitle>
            </CardHeader>
            <CardContent className="text-caption text-muted">
              호버하면 테두리가 진해져요. 그림자는 안 써요.
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-caption text-muted">남은 크레딧</p>
              <p className="mt-1 font-display text-metric font-semibold tabular">
                12
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="입력">
        <div className="grid max-w-[420px] gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ks-name">캐릭터 이름</Label>
            <Input id="ks-name" placeholder="기본 나" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ks-bad">에러 상태</Label>
            <Input id="ks-bad" defaultValue="" invalid />
            <FieldError>이름을 적어 주세요.</FieldError>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ks-select">캐릭터</Label>
            <Select
              id="ks-select"
              defaultValue="a"
              items={[
                { value: "a", label: "기본 나" },
                { value: "b", label: "짧은 머리" },
                { value: "c", label: "밝은 갈색 (준비 중)", disabled: true },
              ]}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ks-memo">메모</Label>
            <Textarea id="ks-memo" placeholder="여기에 적어 주세요" />
          </div>
          <p className="text-caption text-muted">
            클릭하거나 Tab으로 들어가면 테두리가 차콜로 진해지고 같은 톤의 링이 붙어요.
            드래그 선택과 같은 계열이에요.
          </p>
        </div>
      </Section>

      <Section title="Stepper">
        <div className="max-w-[560px]">
          <Stepper steps={["이름 짓기", "사진 5장", "확인"]} current={1} />
        </div>
      </Section>

      <Section title="CreditStrip">
        <div className="grid gap-4 lg:grid-cols-2">
          <CreditStrip balance={12} />
          <CreditStrip balance={1} />
        </div>
      </Section>

      <Section title="표">
        <div className="rounded-[12px] border border-line bg-cream px-2">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>내용</TableHeaderCell>
                <TableHeaderCell numeric>증감</TableHeaderCell>
                <TableHeaderCell numeric>잔량</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell className="text-ink">영상 변환</TableCell>
                <TableCell numeric>−1</TableCell>
                <TableCell numeric>12</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-ink">가입 보너스</TableCell>
                <TableCell numeric>+15</TableCell>
                <TableCell numeric>15</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Section>

      <Section title="스켈레톤">
        <div className="grid max-w-[420px] gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-[23px] w-full" />
          <Skeleton className="h-[23px] w-2/3" />
        </div>
      </Section>

      <Section title="EmptyState">
        <EmptyState
          icon={Users}
          title="아직 캐릭터가 없어요"
          description="톤을 골라 나를 대신할 캐릭터를 만들 수 있어요."
          action={{ label: "캐릭터 만들기", href: "/characters/new" }}
        />
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 border-t border-line pt-8">
      <h2 className="mb-5 font-display text-section font-semibold">{title}</h2>
      {children}
    </section>
  );
}
