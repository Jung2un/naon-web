import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DESIGN.md §6 — 표
 * 행 구분은 1px 하단 선. 줄무늬 배경을 쓰지 않는다.
 * 헤더는 11px 대문자 라벨 스타일. 숫자 열은 오른쪽 정렬 + tabular-nums.
 * 넓은 표만 예외로 자기 컨테이너에 overflow-x: auto를 갖는다.
 */
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full min-w-[520px] border-collapse", className)}
        {...props}
      />
    </div>
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr className={cn("border-b border-line last:border-0", className)} {...props} />
  );
}

export function TableHeaderCell({
  className,
  numeric,
  ...props
}: React.ComponentProps<"th"> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line px-3 py-2 text-left text-label uppercase text-muted",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  numeric,
  ...props
}: React.ComponentProps<"td"> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        "px-3 py-3 text-sm text-body align-middle",
        numeric && "tabular text-right text-ink",
        className,
      )}
      {...props}
    />
  );
}
