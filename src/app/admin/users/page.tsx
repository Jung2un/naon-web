import Link from "next/link";
import { Search } from "lucide-react";
import { adminRead, pageNumber, textParam } from "@/lib/admin/data";
import type { AdminUser, PageResult } from "@/lib/admin/types";
import {
  AdminHeading,
  Panel,
  Pagination,
  number,
  time,
} from "@/components/admin/AdminUI";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = textParam(params.q),
    filter = params.filter === "empty" ? "empty" : "all";
  const data = await adminRead<PageResult<AdminUser>>("users", {
    search: q,
    filter,
    page: pageNumber(params.page),
  });
  return (
    <>
      <AdminHeading
        title="사용자 관리"
        description="이메일 또는 이름으로 찾아 잔액을 확인하고 크레딧을 충전하세요."
      />
      <form className="mb-6 flex flex-wrap gap-3" action="/admin/users">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">이메일, 이름 또는 사용자 ID</span>
          <Search
            className="absolute left-3 top-3.5 size-4 text-muted"
            aria-hidden
          />
          <Input
            name="q"
            defaultValue={q}
            maxLength={120}
            placeholder="이메일, 이름 또는 사용자 ID 검색"
            className="pl-10"
          />
        </label>
        <select
          name="filter"
          defaultValue={filter}
          aria-label="잔액 필터"
          className="min-h-12 rounded-xl border border-line bg-surface px-4 text-sm"
        >
          <option value="all">모든 사용자</option>
          <option value="empty">잔액 0인 사용자</option>
        </select>
        <Button type="submit" variant="primary">
          검색
        </Button>
        {(q || filter !== "all") && (
          <Button asChild>
            <Link href="/admin/users">초기화</Link>
          </Button>
        )}
      </form>
      <Panel title={`사용자 ${number(data.total)}명`}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>사용자</TableHeaderCell>
              <TableHeaderCell numeric>잔액</TableHeaderCell>
              <TableHeaderCell>가입일</TableHeaderCell>
              <TableHeaderCell>최근 로그인</TableHeaderCell>
              <TableHeaderCell>
                <span className="sr-only">관리</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.length ? (
              data.items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-semibold">
                      {u.display_name || "이름 없음"}{" "}
                      {u.is_admin && (
                        <span className="ml-1 rounded-full bg-primary-soft px-2 py-1 text-xs font-normal">
                          관리자
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-caption text-muted">
                      {u.email || "이메일 없음"}
                    </p>
                  </TableCell>
                  <TableCell numeric>{number(u.credits)}개</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {time(u.created_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {time(u.last_sign_in_at)}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" asChild>
                      <Link href={`/admin/users/${u.id}`}>상세·충전</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted">
                  조건에 맞는 사용자가 없습니다. 검색어를 바꿔 보세요.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination
          path="/admin/users"
          total={data.total}
          page={data.page}
          query={{ q, filter }}
        />
      </Panel>
    </>
  );
}
