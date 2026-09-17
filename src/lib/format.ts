import { formatDistanceToNowStrict } from "date-fns";
import { ko } from "date-fns/locale";

/** "3분 전" */
export function relativeTime(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), {
    addSuffix: true,
    locale: ko,
  });
}

/** "2026. 9. 16. 오후 1:20" */
export function fullTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** 세로로 정렬되는 숫자는 전부 tabular-nums와 같이 쓴다. */
export function credits(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n);
}

/** 크레딧 증감. 음수를 빨강으로 칠하지 않는다 — 차감은 정상 동작이다. */
export function signedCredits(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${credits(Math.abs(n))}`;
}

/** 12.4초 */
export function duration(seconds: number | null): string {
  if (seconds === null) return "—";
  return `${seconds.toFixed(1)}초`;
}

/**
 * 목적격 조사를 붙인다. "나이대를" · "성별을"
 *
 * 빠진 항목을 이어 붙이는 문구는 마지막 단어가 그때그때 바뀐다.
 * "을"로 박아두면 "나이대을"이 되고, "를"로 박아두면 "이름를"이 된다.
 * 한글 음절이 아니면(숫자·영문) 받침을 알 수 없어 "을(를)"로 둔다.
 */
export function withObjectParticle(word: string): string {
  const last = word.trim().at(-1);
  if (!last) return word;
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return `${word}을(를)`;
  return `${word}${code % 28 === 0 ? "를" : "을"}`;
}
