import Link from "next/link";
import { notFound } from "next/navigation";
import { adminRead, pageNumber } from "@/lib/admin/data";
import type { UserDetail, AdminLedger, PageResult } from "@/lib/admin/types";
import {
  AdminHeading,
  Panel,
  Pagination,
  Stat,
  number,
  time,
} from "@/components/admin/AdminUI";
import { TopupForm } from "@/components/admin/TopupForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { LEDGER_REASON_LABEL, type LedgerReason } from "@/types/models";
const filters = [
  ["all", "전체"],
  ["used", "사용"],
  ["charged", "충전"],
  ["refunded", "환불"],
];
export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params,
    search = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const filter = filters.some(([key]) => key === search.filter)
    ? String(search.filter)
    : "all";
  const [user, ledger] = await Promise.all([
    adminRead<UserDetail>("user", { user_id: id }),
    adminRead<PageResult<AdminLedger>>("ledger", {
      user_id: id,
      filter,
      page: pageNumber(search.page),
    }),
  ]);
  return (
    <>
      <Link
        href="/admin/users"
        className="mb-5 inline-flex min-h-11 items-center text-sm text-muted"
      >
        ← 사용자 목록
      </Link>
      <AdminHeading
        title={user.display_name || "이름 없는 사용자"}
        description={user.email || "이메일 없음"}
        action={<TopupForm user={user} />}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="현재 잔액"
          value={`${number(user.credits)}개`}
          note={user.is_admin ? "관리자 계정" : "일반 사용자"}
        />
        <Stat
          label="누적 충전"
          value={`${number(user.purchased_credits)}개`}
          note="가입 보너스·테스트 지급 제외"
        />
        <Stat
          label="누적 사용"
          value={`${number(user.used_credits)}개`}
          note="캐릭터·룩·영상 생성 차감 합계"
        />
        <Stat
          label="누적 실패 환불"
          value={`${number(user.refunded_credits)}개`}
          note="실패한 생성에 대해 반환된 크레딧"
        />
      </div>
      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 rounded-xl bg-primary-soft p-4 text-sm text-muted">
        <span>가입 {time(user.created_at)}</span>
        <span>최근 로그인 {time(user.last_sign_in_at)}</span>
        <span>
          캐릭터 {user.characters} · 룩 {user.looks} · 작업물 {user.jobs}
        </span>
        <span className="break-all">ID {user.id}</span>
      </div>
      <Panel
        title="크레딧 사용 내역"
        description="사용·충전·환불 시점의 잔액을 확인할 수 있습니다."
        action={
          <nav aria-label="내역 종류" className="flex gap-1">
            {filters.map(([key, label]) => (
              <Link
                key={key}
                href={`/admin/users/${id}?filter=${key}`}
                aria-current={filter === key ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-xl px-3 text-sm ${filter === key ? "bg-primary text-on-dark" : "text-muted hover:bg-hover"}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        }
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>시각</TableHeaderCell>
              <TableHeaderCell>내용</TableHeaderCell>
              <TableHeaderCell numeric>증감</TableHeaderCell>
              <TableHeaderCell numeric>처리 후 잔액</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ledger.items.length ? (
              ledger.items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap">
                    {time(e.created_at)}
                  </TableCell>
                  <TableCell>
                    {LEDGER_REASON_LABEL[e.reason as LedgerReason] || e.reason}
                    {e.memo && (
                      <p className="mt-1 max-w-lg break-all text-caption text-muted">
                        {e.memo}
                      </p>
                    )}
                  </TableCell>
                  <TableCell numeric>
                    {e.delta > 0 ? "+" : ""}
                    {number(e.delta)}
                  </TableCell>
                  <TableCell numeric>{number(e.balance_after)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted">
                  해당하는 내역이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination
          total={ledger.total}
          page={ledger.page}
          path={`/admin/users/${id}`}
          query={{ filter }}
        />
      </Panel>
    </>
  );
}
