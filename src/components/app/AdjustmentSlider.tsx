"use client";

import {
  Eye,
  Palette,
  RotateCcw,
  Ruler,
  ScanFace,
  SlidersHorizontal,
  Sparkles,
  Spline,
  Triangle,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MicroLabel } from "@/components/ui/label";
import { credits } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ADJUSTMENT_GROUPS,
  ADJUSTMENT_RANGE,
  type AdjustmentKey,
  type Adjustments,
} from "@/types/models";

/**
 * 얼굴 세부 조정 슬라이더. -100 ~ +100을 연속으로, 가운데가 "그대로". — docs/기획서.md §3
 *
 * 숫자는 안 보여준다. "+2"·"-2" 같은 값은 얼굴을 고치는 감각과 맞지 않았다 — 양 끝 라벨과
 * 위의 미리보기가 값의 전부다. 값은 정수만 오간다 — 자유 프롬프트가 아니다. 문장은 서버가 만든다.
 * 색은 새로 만들지 않는다. 트랙은 sunken, 손잡이는 primary(차콜), 가운데 눈금은 line-strong.
 */
export function AdjustmentSlider({
  id,
  label,
  low,
  high,
  value,
  max = ADJUSTMENT_RANGE,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  low: string;
  high: string;
  value: number;
  /** 위쪽 한계. 화장처럼 한쪽으로만 가는 슬라이더는 0 */
  max?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  // 가운데 눈금은 "그대로"(0) 자리. 한쪽 슬라이더에서는 오른쪽 끝이 0이다
  const zeroAt = `${((0 + ADJUSTMENT_RANGE) / (max + ADJUSTMENT_RANGE)) * 100}%`;
  return (
    <div>
      <label htmlFor={id} className="text-sm text-body">
        {label}
      </label>
      <div className="relative mt-1">
        {/* 가운데 눈금 — "그대로" 자리 */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-line-strong"
          style={{ left: zeroAt }}
        />
        <input
          id={id}
          type="range"
          min={-ADJUSTMENT_RANGE}
          max={max}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          onDoubleClick={() => onChange(0)}
          aria-valuetext={
            value === 0
              ? "그대로"
              : `${value > 0 ? high : low} ${Math.round(Math.abs(value))}%`
          }
          className={cn(
            "relative block h-8 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-default disabled:opacity-40",
            // 트랙
            "[&::-webkit-slider-runnable-track]:h-[3px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-sunken",
            "[&::-moz-range-track]:h-[3px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-sunken",
            // 손잡이 — 차콜 원, 크림 테두리
            "[&::-webkit-slider-thumb]:-mt-[8px] [&::-webkit-slider-thumb]:size-[19px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-focus",
            "[&::-moz-range-thumb]:size-[19px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-primary",
            "focus-visible:outline-none [&:focus-visible::-webkit-slider-thumb]:ring-2 [&:focus-visible::-webkit-slider-thumb]:ring-ring-subtle",
          )}
        />
      </div>
      <div className="flex justify-between text-[11px] leading-none text-muted" aria-hidden>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

/** 묶음마다 아이콘. 글자만 있으면 묶음 경계가 안 보인다. 제목은 models.ts의 ADJUSTMENT_GROUPS다 */
const GROUP_ICON: Record<string, LucideIcon> = {
  "머리색": Palette,
  "메이크업": Sparkles,
  "눈": Eye,
  "코": Triangle,
  "눈썹": Spline,
  "중안부": Ruler,
  "턱 라인": ScanFace,
};

/**
 * 세부 조정 독 — 화면 오른쪽 아래에 떠 있는 버튼과 패널.
 *
 * 본문에 슬라이더를 그대로 펼치면 다듬기 화면이 설정 페이지가 된다. 그래서 오른쪽 아래
 * 둥근 버튼 하나로 접어 두고, 열면 패널이 그 자리에 뜬다. 패널 위의 작은 미리보기는 스크롤로
 * 본문 얼굴이 안 보일 때를 위한 것이고, **열려 있는 동안 본문의 "지금 얼굴"이 커진다**(CharacterStudio).
 * 열림 상태는 부모가 갖는다 — 그래야 본문이 그 상태를 보고 얼굴을 키운다.
 * 모바일에서는 하단 탭(--bottom-nav-h) 위에 붙고, 패널은 화면 폭을 다 쓴다.
 * z-index는 하단 탭(40)과 같은 층, 액션바(30)보다 위. 시트(50)보다는 아래.
 */
export function AdjustmentDock({
  open,
  onOpenChange,
  value,
  disabled,
  dirty,
  pending,
  cost,
  onChange,
  onReset,
  onResetGroup,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: Adjustments;
  disabled?: boolean;
  /** 서버에 저장된 값과 다른가 — 적용 버튼이 이걸 본다 */
  dirty: boolean;
  pending?: boolean;
  cost: number;
  onChange: (key: AdjustmentKey, next: number) => void;
  /** 전부 그대로로 */
  onReset: () => void;
  /** 한 묶음만 그대로로. 다른 묶음은 건드리지 않는다 */
  onResetGroup: (keys: readonly AdjustmentKey[]) => void;
  onApply: () => void;
}) {
  const setOpen = onOpenChange;
  const touched = Object.values(value).some((v) => v);

  return (
    <>
      {/* 여는 버튼. 패널이 열리면 패널 헤더의 X가 이 자리를 대신한다 */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="adjustment-dock"
          className={cn(
            "fixed right-4 z-40 flex h-12 items-center gap-2 rounded-full border border-line bg-primary pl-4 pr-5 text-sm font-semibold text-on-dark shadow-overlay",
            "bottom-[calc(var(--bottom-nav-h,0px)+1rem)] lg:bottom-6 lg:right-6",
            "transition-[transform,opacity] duration-150 ease-out active:scale-[0.98]",
          )}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          세부 조정
          {touched && (
            <span className="ml-0.5 size-2 rounded-full bg-on-dark" aria-label="조정한 값이 있어요" />
          )}
        </button>
      )}

      {open && (
        <section
          id="adjustment-dock"
          aria-label="얼굴 세부 조정"
          className={cn(
            "fixed z-40 flex flex-col overflow-hidden border border-line bg-surface shadow-overlay",
            // 모바일: 하단 탭 위에 붙는 시트. 데스크톱: 오른쪽 아래 카드
            "inset-x-0 bottom-[var(--bottom-nav-h,0px)] max-h-[78dvh] rounded-t-[20px]",
            "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[480px] sm:max-h-[min(84dvh,800px)] sm:rounded-[20px]",
          )}
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-ink">세부 조정</p>
              <p className="mt-0.5 text-caption text-muted">얼굴을 보면서 조금씩 조절해 보세요.</p>
            </div>
            <Button variant="outline" size="sm" onClick={onReset} disabled={disabled || !touched}>
              초기화
            </Button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover"
              aria-label="닫기"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-cream px-4 py-4">
            <div className="flex flex-col gap-3">
              {ADJUSTMENT_GROUPS.map((group) => {
                const Icon = GROUP_ICON[group.title] ?? SlidersHorizontal;
                return (
                <section
                  key={group.title}
                  aria-label={group.title}
                  className="rounded-[14px] border border-line bg-surface px-4 pb-4 pt-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-primary" aria-hidden>
                      <Icon className="size-4" strokeWidth={2} />
                    </span>
                    <MicroLabel>{group.title}</MicroLabel>
                    {/* 이 묶음만 되돌린다. 다른 묶음은 그대로 */}
                    <button
                      type="button"
                      onClick={() => onResetGroup(group.items.map((item) => item.key))}
                      disabled={disabled || !group.items.some((item) => value[item.key])}
                      className="ml-auto inline-flex h-8 items-center gap-1 rounded-full px-2 text-caption text-muted transition-colors hover:bg-hover hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
                      aria-label={`${group.title} 되돌리기`}
                    >
                      <RotateCcw className="size-3.5" aria-hidden />
                      되돌리기
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {group.items.map((item) =>
                      item.toggle ? (
                        <label
                          key={item.key}
                          htmlFor={`adjust-${item.key}`}
                          className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-body sm:col-span-2"
                        >
                          <input
                            id={`adjust-${item.key}`}
                            type="checkbox"
                            checked={(value[item.key] ?? 0) >= ADJUSTMENT_RANGE / 2}
                            disabled={disabled}
                            onChange={(e) => onChange(item.key, e.target.checked ? ADJUSTMENT_RANGE : 0)}
                            className="size-4 accent-primary"
                          />
                          {item.label}
                        </label>
                      ) : (
                        <AdjustmentSlider
                          key={item.key}
                          id={`adjust-${item.key}`}
                          label={item.label}
                          low={item.low}
                          high={item.high}
                          value={value[item.key] ?? 0}
                          max={item.max}
                          disabled={disabled}
                          onChange={(next) => onChange(item.key, next)}
                        />
                      ),
                    )}
                  </div>
                </section>
                );
              })}
            </div>
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-line bg-cream px-4 py-3">
            <span className="text-caption text-muted">
              {dirty ? (
                <>
                  적용하면 진짜 결과가 나와요 · 크레딧{" "}
                  <span className="tabular text-ink">{credits(cost)}</span>
                </>
              ) : (
                "미리보기예요. 바꾼 게 없어요"
              )}
            </span>
            <Button variant="primary" size="sm" onClick={onApply} disabled={!dirty || disabled || pending}>
              {pending ? "고치는 중…" : "이 수정 적용"}
            </Button>
          </footer>
        </section>
      )}
    </>
  );
}
