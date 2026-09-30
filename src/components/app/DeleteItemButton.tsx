"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteOwnedItem } from "@/app/(app)/delete-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
export function DeleteItemButton({
  kind,
  id,
  name,
  busy = false,
  redirectTo,
  iconOnly = false,
}: {
  kind: "job" | "character";
  id: string;
  name: string;
  busy?: boolean;
  redirectTo?: string;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  const label = kind === "job" ? "작업물" : "캐릭터";
  async function remove() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await deleteOwnedItem(kind, id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (redirectTo) router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("삭제하지 못했어요. 연결 상태를 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <Button
        size={iconOnly ? "icon" : "sm"}
        variant="ghost"
        disabled={busy}
        aria-label={`${name} ${label} 삭제${busy ? " (생성 완료 후 가능)" : ""}`}
        title={busy ? "생성이 끝난 뒤 삭제할 수 있어요" : `${label} 삭제`}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <Trash2 aria-hidden />
        {!iconOnly && <span>삭제</span>}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {kind === "job" ? "작업물을" : "캐릭터를"} 삭제할까요?
            </DialogTitle>
          </DialogHeader>
          <DialogDescription asChild className="mt-5">
            <div>
              <p>
                <strong className="font-semibold text-ink">{name}</strong>
                {kind === "character"
                  ? " 캐릭터는 목록에서 삭제되며 새 작업에 사용할 수 없어요. 이미 만든 영상과 크레딧 내역은 유지돼요."
                  : " 작업물은 목록에서 삭제돼요. 사용한 크레딧은 반환되지 않으며 사용 내역은 유지돼요."}
              </p>
              <p className="mt-4 text-sm text-body">
                삭제 후 직접 복구할 수 없어요.
              </p>
            </div>
          </DialogDescription>
          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button disabled={pending} onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              className="border-danger bg-danger text-on-dark hover:bg-danger/90"
              disabled={pending}
              onClick={remove}
            >
              {pending ? "삭제 중…" : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
