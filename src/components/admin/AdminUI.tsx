import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { Topup, PageResult, Overview } from "@/lib/admin/types";
export const number = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(value);
export const time = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "기록 없음";
export function AdminHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-xs tracking-widest text-muted">
          STUDIO / OPERATIONS
        </p>
        <h1 className="font-display text-title-mobile font-semibold text-ink lg:text-title">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </div>
      {action}
    </header>
  );
}
export function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-[20px] border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-5">
        <div>
          <h2 className="font-display font-semibold text-ink">{title}</h2>
          {description && (
            <p className="mt-1 text-caption text-muted">{description}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
export function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[20px] border border-line bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="my-3 font-display text-3xl font-semibold tabular-nums text-ink">
        {value}
      </p>
      <p className="text-caption text-muted">{note}</p>
    </div>
  );
}
export function Pagination({
  total,
  page,
  path,
  query = {},
}: {
  total: number;
  page: number;
  path: string;
  query?: Record<string, string>;
}) {
  const pages = Math.max(1, Math.ceil(total / 25));
  const current = Math.min(Math.max(1, page), pages);
  const visible = Array.from(
    new Set([1, current - 1, current, current + 1, pages]),
  )
    .filter((p) => p >= 1 && p <= pages)
    .sort((a, b) => a - b);
  const href = (p: number) =>
    path + "?" + new URLSearchParams({ ...query, page: String(p) });
  const control =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line px-3 transition-colors hover:bg-hover";
  return (
    <nav
      aria-label="목록 페이지 이동"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-muted"
    >
      <p>
        총 {number(total)}건 · {total ? number((current - 1) * 25 + 1) : 0}–
        {number(Math.min(current * 25, total))}건{" "}
        <span className="whitespace-nowrap">(25건씩)</span>
      </p>
      <div className="flex flex-wrap items-center gap-1">
        {current > 1 ? (
          <Link
            className={control}
            href={href(current - 1)}
            aria-label="이전 페이지"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
        ) : (
          <span
            className={control + " opacity-35"}
            aria-disabled="true"
            aria-label="이전 페이지"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </span>
        )}
        {visible.map((p, index) => (
          <span key={p} className="contents">
            {index > 0 && p - visible[index - 1] > 1 && (
              <span className="px-1" aria-hidden>
                …
              </span>
            )}
            <Link
              href={href(p)}
              aria-label={p + "페이지"}
              aria-current={p === current ? "page" : undefined}
              className={
                control +
                (p === current
                  ? " border-primary bg-primary font-semibold text-on-dark hover:bg-primary"
                  : "")
              }
            >
              {p}
            </Link>
          </span>
        ))}
        {current < pages ? (
          <Link
            className={control}
            href={href(current + 1)}
            aria-label="다음 페이지"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <span
            className={control + " opacity-35"}
            aria-disabled="true"
            aria-label="다음 페이지"
          >
            <ChevronRight className="size-4" aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
export function ActivityChart({ daily }: { daily: Overview["daily"] }) {
  const max = Math.max(1, ...daily.flatMap((d) => [d.used, d.charged]));
  const hasData = daily.some((d) => d.used || d.charged);
  return (
    <div className="px-5 pb-5">
      <div className="mb-6 flex flex-wrap items-center gap-4 text-caption text-muted">
        <span className="flex items-center gap-2">
          <i className="size-2.5 rounded-sm bg-primary" />
          사용
        </span>
        <span className="flex items-center gap-2">
          <i className="size-2.5 rounded-sm bg-[#a29a87]" />
          수동 충전
        </span>
        <span className="ml-auto">단위: 크레딧 · 한국 시간</span>
      </div>
      {!hasData && (
        <p className="mb-4 rounded-xl bg-cream p-4 text-sm text-muted">
          최근 14일간 사용·수동 충전 내역이 없습니다.
        </p>
      )}
      <div
        role="img"
        aria-label="최근 14일 크레딧 사용량과 수동 충전량. 아래 일별 데이터에서 수치를 확인할 수 있습니다."
        className="flex h-44 items-end gap-1 border-b border-line sm:gap-3"
      >
        {daily.map((d) => (
          <div
            key={d.day}
            title={`${d.day}: 사용 ${d.used}, 충전 ${d.charged}`}
            className="flex h-full flex-1 items-end justify-center gap-0.5"
          >
            <div
              className="w-1/3 rounded-t bg-primary"
              style={{
                height: `${(d.used / max) * 100}%`,
                minHeight: d.used ? 3 : 0,
              }}
            />
            <div
              className="w-1/3 rounded-t bg-[#a29a87]"
              style={{
                height: `${(d.charged / max) * 100}%`,
                minHeight: d.charged ? 3 : 0,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs text-muted">
        <span>{daily[0]?.day.slice(5)}</span>
        <span>{daily.at(-1)?.day.slice(5)}</span>
      </div>
      <details className="mt-5 text-sm">
        <summary className="cursor-pointer text-muted">일별 수치 보기</summary>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>날짜</TableHeaderCell>
              <TableHeaderCell numeric>사용</TableHeaderCell>
              <TableHeaderCell numeric>수동 충전</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {daily.map((d) => (
              <TableRow key={d.day}>
                <TableCell>{d.day}</TableCell>
                <TableCell numeric>{number(d.used)}</TableCell>
                <TableCell numeric>{number(d.charged)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </details>
    </div>
  );
}
export function TopupTable({ data }: { data: PageResult<Topup> }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          {["사용자", "입금 / 지급", "입금 확인 정보", "처리 시각"].map((x) => (
            <TableHeaderCell key={x}>{x}</TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.items.length ? (
          data.items.map((t) => (
            <TableRow key={t.request_id}>
              <TableCell>
                {t.user_id ? (
                  <Link
                    href={`/admin/users/${t.user_id}`}
                    className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
                  >
                    {t.user_email}
                    <ArrowUpRight className="size-3" aria-hidden />
                  </Link>
                ) : (
                  t.user_email
                )}
                <p className="mt-1 text-caption text-muted">
                  처리 후 {number(t.balance_after)}개
                </p>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {number(t.amount_krw)}원
                <p className="mt-1 font-semibold">
                  +{number(t.credits)} 크레딧
                </p>
              </TableCell>
              <TableCell>
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-badge font-medium text-success">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    입금 확인 완료
                  </span>
                  {t.note && t.note.trim() !== "입금 확인 완료" && (
                    <span className="max-w-64 whitespace-normal break-words rounded-full bg-sunken px-2.5 py-1 text-badge text-muted">
                      {t.note}
                    </span>
                  )}
                </div>
                {t.depositor}
                <p className="mt-1 max-w-64 break-all text-caption text-muted">
                  {t.payment_reference}
                </p>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <time dateTime={t.created_at}>{time(t.created_at)}</time>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="py-12 text-center text-muted">
              아직 수동 충전 기록이 없습니다.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
