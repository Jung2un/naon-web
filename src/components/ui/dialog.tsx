"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./dialog.module.css";

/** 공통 모달: 제목 → 본문 → 행동. 긴 내용은 화면 안에서 스크롤한다. */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-scrim backdrop-blur-[2px]",
          styles.overlay,
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2",
          "max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain rounded-[24px] border border-line bg-surface p-6 shadow-overlay sm:p-8",
          styles.content,
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary-soft hover:text-ink sm:right-4 sm:top-4"
          aria-label="닫기"
        >
          <X className="size-4" aria-hidden />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-3 pr-9", className)} {...props} />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "break-keep font-display text-[22px] font-semibold leading-snug tracking-[-0.025em] text-ink sm:text-2xl",
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn(
        "break-keep [overflow-wrap:anywhere] text-base leading-[1.75] text-muted",
        className,
      )}
      {...props}
    />
  );
}

/** 작은 화면에서도 취소 → 확인 순서와 같은 버튼 높이를 유지한다. */
export function DialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-7 flex items-center justify-end gap-3 pt-5 [&>button]:min-w-24 [&>button]:flex-1 sm:[&>button]:flex-none",
        className,
      )}
      {...props}
    />
  );
}
