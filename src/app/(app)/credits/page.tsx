import type { Metadata } from "next";
import { Coins } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { CreditStrip } from "@/components/app/CreditStrip";
import { EmptyState } from "@/components/app/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { getLedger, getProfile } from "@/lib/data/queries";
import { fullTime, signedCredits } from "@/lib/format";
import { LEDGER_REASON_LABEL } from "@/types/models";

export const metadata: Metadata = { title: "크레딧" };

export default async function CreditsPage() {
  const [profile, ledger] = await Promise.all([getProfile(), getLedger()]);

  return (
    <>
      <PageHeader
        title="크레딧"
        description="영상 한 편을 바꾸는 데 크레딧 1개를 써요. 실패하면 돌려드려요."
      />

      <CreditStrip balance={profile?.credits ?? 0} />

      <section className="mt-10">
        <SectionHeader title="사용 내역" />

        {ledger.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="아직 사용 내역이 없어요"
            description="크레딧을 쓰거나 충전하면 여기에 쌓여요."
            action={{ label: "캐릭터 보기", href: "/characters" }}
          />
        ) : (
          <div className="rounded-[12px] border border-line bg-cream px-2">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>내용</TableHeaderCell>
                  <TableHeaderCell>시각</TableHeaderCell>
                  <TableHeaderCell numeric>증감</TableHeaderCell>
                  <TableHeaderCell numeric>잔량</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledger.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-ink">
                      {LEDGER_REASON_LABEL[entry.reason]}
                      {entry.memo && (
                        <span className="ml-2 text-caption text-muted">
                          {entry.memo}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted">
                      {fullTime(entry.created_at)}
                    </TableCell>
                    {/* 음수를 빨강으로 칠하지 않는다 — 차감은 정상 동작이다 */}
                    <TableCell numeric>{signedCredits(entry.delta)}</TableCell>
                    <TableCell numeric>{entry.balance_after}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </>
  );
}
