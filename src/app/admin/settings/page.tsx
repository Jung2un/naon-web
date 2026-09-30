import { adminRead } from "@/lib/admin/data";
import type { BillingSettings } from "@/lib/admin/types";
import { AdminHeading } from "@/components/admin/AdminUI";
import { BillingSettingsForm } from "@/components/admin/BillingSettingsForm";
export default async function SettingsPage() {
  const settings = await adminRead<BillingSettings>("billing");
  return (
    <>
      <AdminHeading
        title="요금제·입금 계좌"
        description="충전 안내에 표시할 가격과 계좌를 관리하세요."
      />
      <BillingSettingsForm initial={settings} />
    </>
  );
}
