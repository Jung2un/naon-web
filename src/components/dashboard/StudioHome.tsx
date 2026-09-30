import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CirclePlay,
  Coins,
  Plus,
  UserRound,
  Users,
} from "lucide-react";
import { PageTitleSync } from "@/components/app/app-bar";
import { RecentWork } from "./RecentWork";
import { BackToTop } from "./BackToTop";
import type { CharacterListItem, JobListItem } from "@/types/models";
import styles from "./home.module.css";

type Props = {
  name: string;
  balance: number;
  characters: CharacterListItem[];
  jobs: JobListItem[];
  activeJobs: number;
};
const number = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
const arrowClass =
  "flex size-11 shrink-0 items-center justify-center rounded-full border border-current/15 transition-transform motion-safe:group-hover:-rotate-45";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.16em] text-muted">
      {children}
    </p>
  );
}
function Arrow({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`${arrowClass} ${dark ? "bg-surface text-ink" : "bg-surface/60"}`}
    >
      <ArrowRight className="size-4" aria-hidden />
    </span>
  );
}
function Portrait({
  src,
  label,
  className = "",
  priority = false,
}: {
  src: string;
  label: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-sunken ${className}`}>
      <Image
        src={src}
        alt={label}
        fill
        priority={priority}
        sizes="(max-width: 640px) 65vw, 400px"
        className="object-cover"
      />
    </div>
  );
}
function Greeting({ name }: { name: string }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-sm text-muted">
          {name ? `${name}님, 반가워요` : "나만의 스튜디오에 오신 걸 환영해요"}
        </p>
        <h1
          className={`font-display font-semibold tracking-[-0.04em] text-ink text-[32px] sm:text-[42px]`}
        >
          상상했던 나를, 지금 여기서.
        </h1>
        <PageTitleSync title="홈" back={null} />
      </div>
      <span className="hidden items-center gap-2 pb-1 text-[11px] tracking-[0.14em] text-muted xl:flex">
        <span className="size-1.5 rounded-full bg-primary" />
        YOUR PERSONAL STUDIO
      </span>
    </header>
  );
}

function BentoHero({
  balance,
  characters,
  hasCharacter,
}: {
  balance: number;
  characters: CharacterListItem[];
  hasCharacter: boolean;
}) {
  return (
    <div className={styles.bento}>
      <section className={`${styles.characterFeature} group`}>
        <div className="relative z-10 max-w-[88%]">
          <Eyebrow>01 / CREATE YOUR CHARACTER</Eyebrow>
          <h2 className="mt-5 break-keep text-[34px] font-semibold leading-[1.18] tracking-[-0.055em] sm:text-[42px]">
            나를 닮아도,
            <br />
            전혀 달라도 좋아요.
          </h2>
          <p className="mt-4 max-w-64 break-keep text-sm leading-relaxed text-muted">
            얼굴부터 분위기까지 내 취향대로.
            <br />
            상상 속 캐릭터를 직접 만들어보세요.
          </p>
        </div>
        <div className={styles.bentoPortraits} aria-label="캐릭터 스타일 예시">
          <Portrait
            src="/catalog/tone/male/4.jpg"
            label="남자 캐릭터 스타일 예시"
            className={styles.smallPortrait}
          />
          <Portrait
            src="/catalog/tone/1.jpg"
            label="여자 캐릭터 스타일 예시"
            className={styles.largePortrait}
            priority
          />
        </div>
        <div className="relative z-10 mt-auto flex items-end justify-between gap-3 pt-52 sm:pt-56">
          <Link href="/characters/new" className={styles.createButton}>
            {characters.length ? "새 캐릭터 만들기" : "첫 캐릭터 만들기"}
            <span className={styles.createIcon}>
              <Plus className="size-4" aria-hidden />
            </span>
          </Link>
          <span className="pb-3 text-[10px] text-muted">
            스타일 예시 이미지
          </span>
        </div>
      </section>
      <Link
        href={hasCharacter ? "/jobs/new" : "/characters/new"}
        className={`${styles.videoFeature} group`}
      >
        <div className="relative z-10">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-on-dark/60">
            02 / MAKE IT MOVE
          </p>
          <h2 className="mt-4 break-keep text-[27px] font-semibold leading-tight tracking-[-0.04em]">
            {hasCharacter ? (
              <>
                이번엔 영상 속<br />
                주인공이 되어볼까요?
              </>
            ) : (
              <>
                캐릭터를 완성하면,
                <br />
                영상으로 이어져요.
              </>
            )}
          </h2>
          <p className="mt-3 max-w-56 text-sm text-on-dark/65">
            내 영상에 새로운 모습을 입혀보세요.
          </p>
        </div>
        <div className={styles.filmArt} aria-hidden>
          <div className={styles.filmLine} />
          <CirclePlay className="size-16 stroke-[1]" />
          <div className={styles.filmLine} />
        </div>
        <div className="relative z-10 mt-7 flex items-center justify-between">
          <span className="text-sm font-semibold">
            {hasCharacter ? "영상 만들기" : "캐릭터부터 시작하기"}
          </span>
          <Arrow dark />
        </div>
      </Link>
      <Link href="/credits#charge" className={`${styles.smallCard} group`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">내 크레딧</span>
          <Coins className="size-4 text-muted" aria-hidden />
        </div>
        <p className="my-4 font-display text-[38px] font-semibold leading-none tracking-tight tabular-nums">
          {number(balance)}
          <span className="ml-1 text-sm font-normal text-muted">개</span>
        </p>
        <div className="flex items-center justify-between text-caption text-muted">
          <span>{balance === 0 ? "충전 안내 보기" : "필요할 때 충전하기"}</span>
          <ArrowUpRight className="size-4" aria-hidden />
        </div>
      </Link>
      <Link href="/characters" className={`${styles.smallCard} group`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">내 캐릭터</span>
          <Users className="size-4 text-muted" aria-hidden />
        </div>
        <div className="my-4 flex min-h-[38px] items-center">
          <p className="font-display text-[38px] font-semibold leading-none tracking-tight">
            {characters.length}
            <span className="ml-1 text-sm font-normal text-muted">명</span>
          </p>
          <div className="ml-auto flex -space-x-2" aria-hidden>
            {characters.slice(0, 2).map((c) => (
              <Avatar key={c.id} character={c} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-caption text-muted">
          <span>
            {characters.length
              ? "만들던 캐릭터 이어가기"
              : "첫 캐릭터 만나보기"}
          </span>
          <ArrowUpRight className="size-4" aria-hidden />
        </div>
      </Link>
    </div>
  );
}

function Avatar({ character }: { character: CharacterListItem }) {
  return (
    <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-primary-soft">
      {character.thumbnail_url ? (
        <Image
          src={character.thumbnail_url}
          alt=""
          fill
          sizes="40px"
          className="object-cover"
        />
      ) : (
        <UserRound className="size-4 text-muted" aria-hidden />
      )}
    </span>
  );
}
function CharacterShelf({ characters }: { characters: CharacterListItem[] }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <Eyebrow>YOUR CHARACTERS</Eyebrow>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight">
            {characters.length
              ? "이어서 만나볼까요?"
              : "내 첫 캐릭터를 만나보세요"}
          </h2>
        </div>
        <Link
          href="/characters"
          className="inline-flex min-h-11 items-center gap-1 text-sm text-muted hover:text-ink"
        >
          전체 보기
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {characters.slice(0, 2).map((c) => (
          <Link
            key={c.id}
            href={`/characters/${c.id}`}
            className="group flex items-center gap-3 rounded-[18px] border border-line bg-surface p-4 transition-colors hover:bg-primary-soft"
          >
            <Avatar character={c} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{c.name}</p>
              <p className="mt-1 text-caption text-muted">
                {c.status === "processing" || c.status === "queued"
                  ? "만드는 중 · 진행 상황 확인"
                  : c.status === "failed"
                    ? "다시 확인해 주세요"
                    : c.stage === "ready"
                      ? "준비 완료 · 영상으로 만들어보세요"
                      : "만들던 캐릭터 이어가기"}
              </p>
            </div>
            <ArrowUpRight
              className="ml-auto size-4 shrink-0 text-muted"
              aria-hidden
            />
          </Link>
        ))}
        <Link
          href="/characters/new"
          className="group flex min-h-20 items-center justify-center gap-2 rounded-[18px] border border-dashed border-line-strong/40 bg-transparent px-4 text-sm text-muted transition-colors hover:bg-primary-soft"
        >
          <Plus className="size-4" aria-hidden />새 캐릭터 만들기
        </Link>
      </div>
    </section>
  );
}

export function StudioHome(props: Props) {
  const { characters, jobs, activeJobs } = props;
  const hasCharacter = characters.some(
    (c) => c.stage === "ready" && c.status === "done",
  );
  return (
    <div id="studio-home" className={`${styles.home} scroll-mt-40`}>
      <Greeting name={props.name} />
      <BentoHero
        balance={props.balance}
        characters={characters}
        hasCharacter={hasCharacter}
      />
      <RecentWork
        jobs={jobs}
        activeJobs={activeJobs}
        hasCharacter={hasCharacter}
      />
      <CharacterShelf characters={characters} />
      <footer className="mt-12 flex items-center justify-between border-t border-line py-5 text-[11px] tracking-wider text-muted">
        <span>YOUR IMAGINATION, IN MOTION.</span>
      </footer>
      <BackToTop />
    </div>
  );
}
