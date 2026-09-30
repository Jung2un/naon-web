import Link from "next/link";
import { adminRead } from "@/lib/admin/data";
import type { Overview, PageResult, Topup } from "@/lib/admin/types";
import {
  AdminHeading,
  Panel,
  Stat,
  ActivityChart,
  TopupTable,
  number,
} from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
export default async function AdminDashboard() {
  const [stats, topups] = await Promise.all([
    adminRead<Overview>("overview"),
    adminRead<PageResult<Topup>>("topups"),
  ]);
  return (
    <>
      <AdminHeading
        title="운영 현황"
        description="사용자와 크레딧 흐름을 한눈에 확인하세요."
        action={
          <Button variant="primary" asChild>
            <Link href="/admin/users">사용자 찾고 충전하기</Link>
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="전체 사용자"
          value={`${number(stats.users)}명`}
          note={`최근 14일 신규 ${number(stats.new_users)}명`}
        />
        <Stat
          label="최근 14일 사용"
          value={`${number(stats.used_credits)}개`}
          note="사용 시 차감량 · 실패 환불은 별도"
        />
        <Stat
          label="최근 14일 수동 충전"
          value={`${number(stats.topup_credits)}개`}
          note={`확인한 입금 ${number(stats.deposit_krw)}원`}
        />
        <Stat
          label="전체 보유 크레딧"
          value={`${number(stats.outstanding_credits)}개`}
          note="모든 사용자의 현재 잔액 합계"
        />
      </div>
      <Panel
        title="크레딧 흐름"
        description="최근 14일 · 가입 보너스와 환불은 제외"
      >
        <ActivityChart daily={stats.daily} />
      </Panel>
      <div className="mt-6">
        <Panel
          title="최근 수동 충전"
          description="입금 확인 후 지급된 내역입니다."
          action={
            <Link href="/admin/topups" className="text-sm font-medium">
              전체 보기 →
            </Link>
          }
        >
          <TopupTable data={{ ...topups, items: topups.items.slice(0, 5) }} />
        </Panel>
      </div>
    </>
  );
}
