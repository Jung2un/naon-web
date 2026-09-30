import { adminRead, pageNumber } from "@/lib/admin/data";
import type { Topup, PageResult } from "@/lib/admin/types";
import {
  AdminHeading,
  Panel,
  Pagination,
  TopupTable,
} from "@/components/admin/AdminUI";
export default async function TopupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await adminRead<PageResult<Topup>>("topups", {
    page: pageNumber((await searchParams).page),
  });
  return (
    <>
      <AdminHeading
        title="충전 기록"
        description="입금액, 지급 크레딧, 처리자를 함께 확인하세요. 기존 테스트 지급은 포함하지 않습니다."
      />
      <Panel title="무통장입금 처리 내역">
        <TopupTable data={data} />
        <Pagination total={data.total} page={data.page} path="/admin/topups" />
      </Panel>
    </>
  );
}
