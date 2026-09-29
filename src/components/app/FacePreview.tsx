"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ADJUSTMENT_KEYS, ADJUSTMENT_RANGE, type Adjustments } from "@/types/models";

/**
 * 얼굴 세부 조정의 **즉시 미리보기.** — docs/기획서.md §3
 *
 * 슬라이더를 움직이면 그 자리에서 지금 얼굴이 따라 움직인다. 진짜 결과는 "이 수정 적용"(1크레딧,
 * 30초~2분)이 만들고, 여기는 **방향을 미리 보는 근사치**다 — 이미지 모델을 슬라이더마다 돌릴 수는 없다.
 *
 * 어떻게: 브라우저에서 얼굴 랜드마크(MediaPipe Face Landmarker)를 한 번 찾고, 눈·코·눈썹 자리에
 * 작은 변위장을 얹어 캔버스에서 픽셀을 다시 샘플링한다(리퀴파이).
 * 머리색 강도와 염색(고른 머리색 칩)은 **머리카락 마스크 안에서만** 색을 바꾼다(MediaPipe Image Segmenter, hair 클래스).
 * 전체 필터로 하면 사진 전체의 대비가 같이 움직여서 "머리색"이 아니라 "사진 보정"이 된다.
 * 화장 강도(연하게)는 얼굴 피부 마스크(face-skin 클래스) 안에서 **피부 기준색에서 벗어난 색만** 기준색 쪽으로 되돌린다 —
 * 립 틴트·블러셔처럼 "얹힌 색"이 빠지고, 밝기는 그대로라 피부가 창백해지지 않는다.
 * (처음엔 얼굴 전체의 채도를 낮췄더니 창백한 얼굴이 됐다. 화장은 색이지 채도가 아니다.)
 * 끝까지 내려도 **입술은 자연 입술색으로 남는다** — 당기는 힘의 상한이 절반이다. 100% 당기면 입술이
 * 피부색 그대로의 어두운 덩어리(흑백처럼)가 된다. 눈(홍채·렌즈)은 랜드마크로 잡아 아예 손대지 않는다.
 * 머리 모양은 여기서 못 보여준다. 모양을 바꾸는 건 생성이라 적용해야 나온다.
 * 모델 두 개(랜드마크·세그멘테이션)와 wasm은 CDN에서 처음 한 번 받는다. 못 받으면 원본만 보여준다 —
 * 어느 경우에도 화면이 비지 않는다.
 *
 * 서버가 만드는 문장(_shared/prompt.ts의 ADJUST_PHRASE)과 **방향이 같아야 한다.**
 * +는 위로·진하게·높게, −는 아래로·연하게·낮게. 값은 -100 ~ +100이다.
 */

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const LANDMARK_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
/** 셀피 다중 클래스 — 0 배경 · 1 머리카락 · 2 몸 피부 · 3 얼굴 피부 · 4 옷 · 5 기타 */
const SEGMENT_MODEL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite";
const HAIR_CLASS = 1;
const FACE_SKIN_CLASS = 3;
/** 미리보기 캔버스 너비. 3:4라 높이는 4/3배. 픽셀 루프가 도는 크기라 너무 크면 슬라이더가 끊긴다. */
const PREVIEW_WIDTH = 420;

type Point = { x: number; y: number };
/** 얼굴에서 필요한 자리만. 좌표는 캔버스 픽셀이다. */
type Face = {
  eyeL: Point; // 화면 왼쪽 눈(인물의 오른눈)
  eyeR: Point;
  browL: Point;
  browR: Point;
  noseBridge: Point;
  noseTip: Point;
  chin: Point;
  jawL: Point; // 턱선 중간(턱끝과 턱 각 사이). 화면 왼쪽
  jawR: Point;
  /** 두 눈 중심 사이 거리. 모든 반지름·이동량의 단위다 */
  unit: number;
  eyeHalfWidth: number;
};

// MediaPipe Face Mesh 468점 중 쓰는 점. 이미지 기준 왼쪽(L)이 인물의 오른눈이다.
const L = { outer: 33, inner: 133, top: 159, bottom: 145, browOuter: 70, browInner: 107, browMid: 105 };
const R = { outer: 263, inner: 362, top: 386, bottom: 374, browOuter: 300, browInner: 336, browMid: 334 };
const NOSE = { bridge: 6, tip: 1 };
const JAW = { chin: 152, midL: 136, midR: 365 };

type Landmark = { x: number; y: number };

function faceFrom(lm: Landmark[], w: number, h: number): Face {
  const p = (i: number): Point => ({ x: lm[i].x * w, y: lm[i].y * h });
  const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const eyeL = mid(mid(p(L.outer), p(L.inner)), mid(p(L.top), p(L.bottom)));
  const eyeR = mid(mid(p(R.outer), p(R.inner)), mid(p(R.top), p(R.bottom)));
  const unit = Math.hypot(eyeR.x - eyeL.x, eyeR.y - eyeL.y);
  return {
    eyeL,
    eyeR,
    browL: mid(mid(p(L.browOuter), p(L.browInner)), p(L.browMid)),
    browR: mid(mid(p(R.browOuter), p(R.browInner)), p(R.browMid)),
    noseBridge: mid(p(NOSE.bridge), p(NOSE.tip)),
    noseTip: p(NOSE.tip),
    chin: p(JAW.chin),
    jawL: p(JAW.midL),
    jawR: p(JAW.midR),
    unit,
    eyeHalfWidth: Math.abs(p(L.outer).x - p(L.inner).x) / 2 || unit * 0.25,
  };
}

/** 변위장 하나. 중심에서 radius 안의 픽셀을 `move`가 정하는 만큼 옮긴다(부드러운 종 모양 감쇠). */
type Field = { c: Point; radius: number; move: (dx: number, dy: number) => [number, number] };

function fieldsFor(face: Face, a: Adjustments): Field[] {
  const u = face.unit;
  // -100~100을 -2~2 스케일로. 끝까지 밀면 두 칸 움직인 만큼이다
  const v = (key: keyof Adjustments) => ((a[key] ?? 0) / ADJUSTMENT_RANGE) * 2;
  const fields: Field[] = [];

  const lift = (c: Point, radius: number, amount: number): Field => ({
    c,
    radius,
    move: () => [0, -amount],
  });
  // 바깥 눈꼬리가 올라가는 기울임. side는 바깥이 +x인 눈이면 +1, −x인 눈이면 −1.
  const tilt = (c: Point, radius: number, hw: number, amount: number, side: 1 | -1): Field => ({
    c,
    radius,
    move: (dx) => [0, -amount * (dx / hw) * side],
  });

  if (v("eye_height")) {
    const d = v("eye_height") * 0.045 * u;
    fields.push(lift(face.eyeL, 0.55 * u, d), lift(face.eyeR, 0.55 * u, d));
  }
  if (v("eye_tilt")) {
    const d = v("eye_tilt") * 0.05 * u;
    fields.push(
      tilt(face.eyeL, 0.6 * u, face.eyeHalfWidth, d, -1),
      tilt(face.eyeR, 0.6 * u, face.eyeHalfWidth, d, 1),
    );
  }
  if (v("brow_height")) {
    const d = v("brow_height") * 0.045 * u;
    fields.push(lift(face.browL, 0.5 * u, d), lift(face.browR, 0.5 * u, d));
  }
  if (v("brow_tilt")) {
    const d = v("brow_tilt") * 0.05 * u;
    fields.push(
      tilt(face.browL, 0.55 * u, face.eyeHalfWidth * 1.2, d, -1),
      tilt(face.browR, 0.55 * u, face.eyeHalfWidth * 1.2, d, 1),
    );
  }
  if (v("nose_height")) {
    // 콧대가 높아지면 콧등이 가늘어 보인다 — 2D에서 낼 수 있는 건 폭뿐이다.
    const k = v("nose_height") * 0.07;
    fields.push({ c: face.noseBridge, radius: 0.55 * u, move: (dx) => [dx * k, 0] });
  }
  if (v("nose_tilt")) {
    const d = v("nose_tilt") * 0.035 * u;
    fields.push(lift(face.noseTip, 0.35 * u, d));
  }
  if (v("jaw_vline")) {
    // 턱선 양쪽을 얼굴 가운데 축 쪽으로(+) 또는 바깥으로(−) 민다. 턱끝 근처가 갸름해진다
    const d = v("jaw_vline") * 0.045 * u;
    fields.push(
      { c: face.jawL, radius: 0.55 * u, move: () => [d, 0] },
      { c: face.jawR, radius: 0.55 * u, move: () => [-d, 0] },
    );
  }
  if (v("chin_length")) {
    // 턱끝을 아래로(+) 또는 위로(−). lift는 위가 +라 부호를 뒤집는다
    const d = v("chin_length") * 0.05 * u;
    fields.push(lift(face.chin, 0.5 * u, -d));
  }
  return fields;
}

type Rgb = [number, number, number];

/**
 * 얼굴 피부의 기준 색차(Cb·Cr). 마스크가 확실한(0.8+) 중간 밝기 픽셀의 평균이다.
 * 립·블러셔는 소수라 평균을 크게 흔들지 않고, 그래서 "기준에서 벗어난 색"으로 잡힌다.
 */
/** 머리카락의 평균 밝기. 염색할 때 "지금 머리가 얼마나 밝은가"의 기준이다. */
function meanLuma(base: ImageData, mask: Float32Array): number {
  const s = base.data;
  let sum = 0, n = 0;
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    if (mask[i] < 0.8) continue;
    sum += 0.299 * s[p] + 0.587 * s[p + 1] + 0.114 * s[p + 2];
    n++;
  }
  return n ? sum / n : 0;
}

function skinReference(base: ImageData, mask: Float32Array): [number, number] {
  const s = base.data;
  let cb = 0, cr = 0, n = 0;
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    if (mask[i] < 0.8) continue;
    const r = s[p], g = s[p + 1], b = s[p + 2];
    const Y = 0.299 * r + 0.587 * g + 0.114 * b;
    if (Y < 60 || Y > 235) continue;
    cb += -0.1687 * r - 0.3313 * g + 0.5 * b;
    cr += 0.5 * r - 0.4187 * g - 0.0813 * b;
    n++;
  }
  return n ? [cb / n, cr / n] : [0, 0];
}
function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/**
 * 출력 픽셀마다 "어디서 가져올지"를 정해 다시 샘플링한다(역방향 매핑, 쌍선형).
 * 같은 루프에서 머리카락 마스크 안의 픽셀에만 염색·색 강도를, 얼굴 피부 마스크에만 화장 강도를 건다 — 두 번 돌지 않게.
 */
function render(
  src: ImageData,
  dst: ImageData,
  fields: Field[],
  hair: { mask: Float32Array; depth: number; tint: Rgb | null; meanLuma: number } | null,
  skin: { mask: Float32Array; makeup: number; ref: [number, number]; keepOut: Point[]; keepOutRadius: number } | null,
) {
  const { width: w, height: h, data: s } = src;
  const d = dst.data;
  // 머리색 강도. +면 진하게(채도 ↑·밝기 ↓), −면 연하게. 끝까지 밀어도 머리가 검게 뭉개지지 않는 크기.
  const t = hair ? hair.depth / ADJUSTMENT_RANGE : 0;
  const satK = 1 + t * 0.45;
  const lumK = 1 - t * 0.22;
  // 염색 — 머리의 평균 밝기를 고른 색의 밝기로 옮기고, 가닥마다의 명암은 그 비율대로 남긴다.
  // (색상만 바꾸고 밝기를 두면 갈색 머리에 검정을 골라도 회색이 된다 — 검정은 색이 아니라 밝기다.)
  const tint = hair?.tint ?? null;
  const hairMean = Math.max(hair?.meanLuma ?? 0, 8);
  // 화장 연하게 — 0 ~ 1. 피부 기준 색차(Cb·Cr)에서 멀리 떨어진 픽셀(립·블러셔)만 기준 쪽으로 당긴다. 밝기(Y)는 손대지 않는다.
  const m = skin ? Math.min(Math.max(-skin.makeup, 0), ADJUSTMENT_RANGE) / ADJUSTMENT_RANGE : 0;
  const cbRef = skin?.ref[0] ?? 0;
  const crRef = skin?.ref[1] ?? 0;
  // 색차 거리(0~255 스케일)가 이 아래면 피부 그 자체라 건드리지 않고, 위쪽부터 부드럽게 당긴다
  const DEV_LO = 5, DEV_HI = 18;
  // 끝까지 내려도 얹힌 색의 절반만 뺀다 — 화장기 없는 입술도 피부보다는 붉다
  const PULL_MAX = 0.5;
  const keepOut = skin?.keepOut ?? [];
  const keepR2 = skin ? skin.keepOutRadius * skin.keepOutRadius : 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let ox = 0;
      let oy = 0;
      for (const f of fields) {
        const dx = x - f.c.x;
        const dy = y - f.c.y;
        const r2 = (dx * dx + dy * dy) / (f.radius * f.radius);
        if (r2 >= 1) continue;
        const wgt = (1 - r2) * (1 - r2);
        const [mx, my] = f.move(dx, dy);
        ox += mx * wgt;
        oy += my * wgt;
      }
      const o = (y * w + x) * 4;
      let r: number, g: number, b: number;
      if (ox === 0 && oy === 0) {
        r = s[o]; g = s[o + 1]; b = s[o + 2]; d[o + 3] = s[o + 3];
      } else {
        // 화면에서 +로 움직여 보이려면 그 자리엔 −쪽 픽셀을 가져온다
        const sx = Math.min(Math.max(x - ox, 0), w - 1.001);
        const sy = Math.min(Math.max(y - oy, 0), h - 1.001);
        const x0 = sx | 0, y0 = sy | 0;
        const fx = sx - x0, fy = sy - y0;
        const i00 = (y0 * w + x0) * 4, i10 = i00 + 4, i01 = i00 + w * 4, i11 = i01 + 4;
        const mix = (c: number) =>
          s[i00 + c] * (1 - fx) * (1 - fy) + s[i10 + c] * fx * (1 - fy) +
          s[i01 + c] * (1 - fx) * fy + s[i11 + c] * fx * fy;
        r = mix(0); g = mix(1); b = mix(2); d[o + 3] = mix(3);
      }
      if (hair && (t !== 0 || tint)) {
        const a = hair.mask[y * w + x];
        if (a > 0.02) {
          let lum = luma(r, g, b);
          let hr = r, hg = g, hb = b;
          if (tint) {
            const k = lum / hairMean;
            hr = Math.min(tint[0] * k, 255); hg = Math.min(tint[1] * k, 255); hb = Math.min(tint[2] * k, 255);
            lum = luma(hr, hg, hb);
          }
          const nr = (lum + (hr - lum) * satK) * lumK;
          const ng = (lum + (hg - lum) * satK) * lumK;
          const nb = (lum + (hb - lum) * satK) * lumK;
          r = r + (nr - r) * a; g = g + (ng - g) * a; b = b + (nb - b) * a;
        }
      }
      if (skin && m > 0) {
        let a = skin.mask[y * w + x];
        // 눈(홍채·렌즈)은 화장이 아니다. 눈 중심 반경 안은 손대지 않는다
        for (const k of keepOut) {
          const kx = x - k.x, ky = y - k.y;
          if (kx * kx + ky * ky < keepR2) { a = 0; break; }
        }
        if (a > 0.02) {
          const Y = luma(r, g, b);
          const cb = -0.1687 * r - 0.3313 * g + 0.5 * b;
          const cr = 0.5 * r - 0.4187 * g - 0.0813 * b;
          const dev = Math.hypot(cb - cbRef, cr - crRef);
          if (dev > DEV_LO) {
            const wgt = Math.min((dev - DEV_LO) / (DEV_HI - DEV_LO), 1);
            const pull = m * wgt * a * PULL_MAX;
            const ncb = cb + (cbRef - cb) * pull;
            const ncr = cr + (crRef - cr) * pull;
            r = Y + 1.402 * ncr;
            g = Y - 0.344 * ncb - 0.714 * ncr;
            b = Y + 1.772 * ncb;
          }
        }
      }
      d[o] = r; d[o + 1] = g; d[o + 2] = b;
    }
  }
}

/** 세그멘테이션 결과(256×256 신뢰도)를 캔버스 크기로 늘린다. 경계는 쌍선형이라 저절로 부드럽다. */
function resizeMask(src: Float32Array, sw: number, sh: number, w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const sy = Math.min((y / h) * sh, sh - 1.001);
    const y0 = sy | 0, fy = sy - y0;
    for (let x = 0; x < w; x++) {
      const sx = Math.min((x / w) * sw, sw - 1.001);
      const x0 = sx | 0, fx = sx - x0;
      const i = y0 * sw + x0;
      out[y * w + x] =
        src[i] * (1 - fx) * (1 - fy) + src[i + 1] * fx * (1 - fy) +
        src[i + sw] * (1 - fx) * fy + src[i + sw + 1] * fx * fy;
    }
  }
  return out;
}

const NO_FACE_KEYS = new Set<keyof Adjustments>(["hair_color_depth", "makeup"]);
function needsFace(a: Adjustments): boolean {
  return ADJUSTMENT_KEYS.some((key) => !NO_FACE_KEYS.has(key) && (a[key] ?? 0) !== 0);
}
function idle(a: Adjustments): boolean {
  return ADJUSTMENT_KEYS.every((key) => (a[key] ?? 0) === 0);
}

type Status = "loading" | "ready" | "no-face" | "no-canvas";

export function FacePreview({
  src,
  adjustments,
  hairColor = null,
  className,
}: {
  src: string;
  adjustments: Adjustments;
  /** 고른 머리색 칩의 견본색(#rrggbb). 서버에 저장된 것과 같으면 null — 이미 그 색이다 */
  hairColor?: string | null;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<ImageData | null>(null);
  const faceRef = useRef<Face | null>(null);
  const hairRef = useRef<Float32Array | null>(null);
  const skinRef = useRef<Float32Array | null>(null);
  const skinChromaRef = useRef<[number, number]>([0, 0]);
  const hairLumaRef = useRef(0);
  const frameRef = useRef(0);
  // 상태는 src에 매인다. src가 바뀌면 그 자체로 "loading"이라 effect 안에서 setState를 부를 일이 없다.
  const [state, setState] = useState<{ src: string; status: Status }>({ src, status: "loading" });
  const status: Status = state.src === src ? state.status : "loading";

  // 이미지 한 번 올리고, 랜드마크·머리카락 마스크를 한 번 찾는다. src가 바뀔 때(수정이 끝났을 때)만 다시 한다.
  useEffect(() => {
    let cancelled = false;
    baseRef.current = null;
    faceRef.current = null;
    hairRef.current = null;
    skinRef.current = null;
    const setStatus = (next: Status) => setState({ src, status: next });

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = async () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = PREVIEW_WIDTH;
      const h = Math.round((w * image.naturalHeight) / image.naturalWidth) || Math.round(w * 4 / 3);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(image, 0, 0, w, h);
      try {
        baseRef.current = ctx.getImageData(0, 0, w, h);
      } catch {
        // 다른 출처 이미지에 CORS 헤더가 없으면 캔버스가 잠긴다. 원본은 이미 그려져 있다.
        setStatus("no-canvas");
        return;
      }
      try {
        const { FaceLandmarker, ImageSegmenter, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
        const [landmarker, segmenter] = await Promise.all([
          FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: LANDMARK_MODEL },
            runningMode: "IMAGE",
            numFaces: 1,
          }),
          ImageSegmenter.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: SEGMENT_MODEL },
            runningMode: "IMAGE",
            outputConfidenceMasks: true,
            outputCategoryMask: false,
          }),
        ]);
        const result = landmarker.detect(image);
        landmarker.close();
        const seg = segmenter.segment(image);
        const toCanvas = (index: number) => {
          const mask = seg.confidenceMasks?.[index];
          return mask
            ? resizeMask(Float32Array.from(mask.getAsFloat32Array()), mask.width, mask.height, w, h)
            : null;
        };
        hairRef.current = toCanvas(HAIR_CLASS);
        skinRef.current = toCanvas(FACE_SKIN_CLASS);
        if (skinRef.current && baseRef.current) {
          skinChromaRef.current = skinReference(baseRef.current, skinRef.current);
        }
        if (hairRef.current && baseRef.current) {
          hairLumaRef.current = meanLuma(baseRef.current, hairRef.current);
        }
        seg.close();
        segmenter.close();
        const lm = result.faceLandmarks[0];
        if (cancelled) return;
        if (!lm) {
          setStatus("no-face");
          return;
        }
        faceRef.current = faceFrom(lm, w, h);
        setStatus("ready");
      } catch (e) {
        console.warn("얼굴 미리보기: 얼굴을 못 찾았어요", e);
        if (!cancelled) setStatus("no-face");
      }
    };
    image.onerror = () => {
      if (!cancelled) setStatus("no-canvas");
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  // 슬라이더가 움직일 때마다 한 프레임에 한 번만 다시 그린다.
  useEffect(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const base = baseRef.current;
      const ctx = canvas?.getContext("2d", { willReadFrequently: true });
      if (!canvas || !base || !ctx) return;
      const face = faceRef.current;
      const hair = hairRef.current;
      const skin = skinRef.current;
      const depth = adjustments.hair_color_depth ?? 0;
      const makeup = adjustments.makeup ?? 0;
      const tint = hairColor ? hexToRgb(hairColor) : null;
      if ((idle(adjustments) && !tint) || (!face && !hair && !skin)) {
        ctx.putImageData(base, 0, 0);
        return;
      }
      const out = ctx.createImageData(base.width, base.height);
      render(
        base,
        out,
        face && needsFace(adjustments) ? fieldsFor(face, adjustments) : [],
        hair && (depth || tint) ? { mask: hair, depth, tint, meanLuma: hairLumaRef.current } : null,
        skin && makeup < 0
          ? {
              mask: skin,
              makeup,
              ref: skinChromaRef.current,
              keepOut: face ? [face.eyeL, face.eyeR] : [],
              keepOutRadius: face ? face.unit * 0.32 : 0,
            }
          : null,
      );
      ctx.putImageData(out, 0, 0);
    });
    return () => cancelAnimationFrame(frameRef.current);
  }, [adjustments, hairColor, status]);

  const wanted = !idle(adjustments) || Boolean(hairColor);
  const unavailable = status === "no-face" || status === "no-canvas";

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        className="block size-full object-cover"
        aria-label="얼굴 조정 미리보기"
        role="img"
      />
      {status === "no-canvas" && (
        // 캔버스에 못 올린 경우 원본을 그대로 보여준다. 미리보기는 없지만 얼굴은 보인다.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      )}
      {unavailable && wanted && (
        <p className="absolute inset-x-2 bottom-2 rounded-[8px] bg-scrim px-2 py-1 text-center text-[11px] leading-snug text-on-dark">
          미리보기를 준비하지 못했어요. 적용하면 결과에는 반영돼요.
        </p>
      )}
    </div>
  );
}
