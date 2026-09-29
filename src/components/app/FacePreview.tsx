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
 * 어떻게: 브라우저에서 얼굴 랜드마크(MediaPipe Face Landmarker)를 한 번 찾고, 눈·코·눈썹·턱 자리에
 * 작은 변위장을 얹어 캔버스에서 픽셀을 다시 샘플링한다(리퀴파이). 그 다음 같은 루프에서 색을 만진다.
 *
 *   머리   머리카락 마스크(MediaPipe Image Segmenter, hair 클래스) 안에서만. 염색(고른 칩)과 강도.
 *          강도 "연하게"는 **채도**를 빼는 것이지 머리를 밝히는 게 아니다 — 밝기는 ±10%만 움직인다.
 *   눈썹   눈썹 랜드마크 띠 안의 어두운 픽셀(머리카락 마스크는 뺀다 — 앞머리가 같이 물들면 안 된다).
 *          색 진하기(밝기는 살짝만, 눈썹이 빛나면 안 된다)와 "머리색과 맞추기" — 다듬기에서 고른 머리색 칩의
 *          견본색 그대로를 목표로, 밝기는 그 색의 밝기에 가닥 명암을 얹는다.
 *   메이크업  아이라인·섀도(눈꺼풀 가장자리의 어두움 + 눈꺼풀 띠의 색) · 속눈썹(마스카라로 길어진 바깥 구간의
 *          어두움만 — 눈꺼풀 가장자리의 생속눈썹은 남긴다) · 입술(입 타원의 색) · 블러셔(콧등을 뺀 볼의 색, 끝까지
 *          내리면 거의 사라진다). 전부 **피부 기준색 쪽으로 되돌리는** 것이고 밝기(Y)는 손대지 않아
 *          창백해지거나 흑백이 되지 않는다. 입술은 상한이 있어 끝까지 내려도 입술색이다.
 *
 * 모델 두 개(랜드마크·세그멘테이션)와 wasm은 CDN에서 처음 한 번 받는다. 못 받으면 원본만 보여준다 —
 * 어느 경우에도 화면이 비지 않는다. 머리 모양은 여기서 못 보여준다 — 그건 생성이라 적용해야 나온다.
 *
 * 서버가 만드는 문장(_shared/prompt.ts의 ADJUST_PHRASE)과 **방향이 같아야 한다.**
 * +는 위로·진하게·크게, −는 아래로·연하게·작게. 값은 -100 ~ +100이다.
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
  /** 눈썹 선. 바깥→안쪽 순서 */
  browLineL: Point[];
  browLineR: Point[];
  noseBridge: Point;
  noseTip: Point;
  alaL: Point;
  alaR: Point;
  upperLip: Point;
  mouth: Point;
  mouthHalfWidth: number;
  mouthHalfHeight: number;
  chin: Point;
  cheekL: Point;
  cheekR: Point;
  jawL: Point;
  jawR: Point;
  /** 두 눈 중심 사이 거리. 모든 반지름·이동량의 단위다 */
  unit: number;
  eyeHalfWidth: number;
};

// MediaPipe Face Mesh 468점 중 쓰는 점. 이미지 기준 왼쪽(L)이 인물의 오른눈이다.
const L = { outer: 33, inner: 133, top: 159, bottom: 145, brow: [70, 63, 105, 66, 107] };
const R = { outer: 263, inner: 362, top: 386, bottom: 374, brow: [300, 293, 334, 296, 336] };
const NOSE = { bridge: 6, tip: 1 };
const JAW = { chin: 152, midL: 136, midR: 365 };
const ALA = { left: 129, right: 358 };
const CHEEK = { innerL: 50, outerL: 116, innerR: 280, outerR: 345 };
const MOUTH = { top: 0, bottom: 17, left: 61, right: 291 };

type Landmark = { x: number; y: number };

function faceFrom(lm: Landmark[], w: number, h: number): Face {
  const p = (i: number): Point => ({ x: lm[i].x * w, y: lm[i].y * h });
  const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const eyeL = mid(mid(p(L.outer), p(L.inner)), mid(p(L.top), p(L.bottom)));
  const eyeR = mid(mid(p(R.outer), p(R.inner)), mid(p(R.top), p(R.bottom)));
  const unit = Math.hypot(eyeR.x - eyeL.x, eyeR.y - eyeL.y);
  const browLineL = L.brow.map(p);
  const browLineR = R.brow.map(p);
  const mouthTop = p(MOUTH.top), mouthBottom = p(MOUTH.bottom);
  return {
    eyeL,
    eyeR,
    browL: browLineL[2],
    browR: browLineR[2],
    browLineL,
    browLineR,
    noseBridge: mid(p(NOSE.bridge), p(NOSE.tip)),
    noseTip: p(NOSE.tip),
    alaL: p(ALA.left),
    alaR: p(ALA.right),
    upperLip: mouthTop,
    mouth: mid(mouthTop, mouthBottom),
    mouthHalfWidth: Math.abs(p(MOUTH.right).x - p(MOUTH.left).x) / 2 || unit * 0.35,
    mouthHalfHeight: Math.abs(mouthBottom.y - mouthTop.y) / 2 || unit * 0.12,
    chin: p(JAW.chin),
    // 볼 중심은 코 옆(50)과 바깥 볼(116)의 중간. 콧등 쪽으로 번지지 않게 바깥으로 뺀다
    cheekL: mid(p(CHEEK.innerL), p(CHEEK.outerL)),
    cheekR: mid(p(CHEEK.innerR), p(CHEEK.outerR)),
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
  // 중심 기준 확대/축소. 변위가 바깥을 향하면 안쪽 픽셀을 끌어와 커 보인다
  const scale = (c: Point, radius: number, kx: number, ky: number): Field => ({
    c,
    radius,
    move: (dx, dy) => [dx * kx, dy * ky],
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
  if (v("eye_scale_x")) {
    const k = v("eye_scale_x") * 0.09;
    fields.push(scale(face.eyeL, 0.7 * u, k, 0), scale(face.eyeR, 0.7 * u, k, 0));
  }
  if (v("eye_scale_y")) {
    const k = v("eye_scale_y") * 0.12;
    fields.push(scale(face.eyeL, 0.6 * u, 0, k), scale(face.eyeR, 0.6 * u, 0, k));
  }
  if (v("brow_thickness")) {
    // 눈썹 선을 중심으로 세로만 늘이고(+) 줄인다(−). 가로는 그대로라 길이는 안 바뀐다
    const k = v("brow_thickness") * 0.16;
    fields.push(scale(face.browL, 0.45 * u, 0, k), scale(face.browR, 0.45 * u, 0, k));
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
  if (v("nose_width")) {
    // 콧볼 양쪽을 코 축 쪽으로(+ 좁게) 또는 바깥으로(− 넓게)
    const d = v("nose_width") * 0.03 * u;
    fields.push(
      { c: face.alaL, radius: 0.28 * u, move: () => [d, 0] },
      { c: face.alaR, radius: 0.28 * u, move: () => [-d, 0] },
    );
  }
  if (v("midface")) {
    // 눈선에서 윗입술까지를 비율대로 늘이고(+) 줄이고(−), 그 아래(입·턱)는 통째로 따라간다.
    // 눈은 안 움직이고 입 모양도 그대로다 — 사이 거리만 바뀐다. 감쇠는 코끝 중심 큰 반경이라 볼·턱에서 부드럽게 죽는다.
    const eyeY = (face.eyeL.y + face.eyeR.y) / 2;
    const span = Math.max(face.upperLip.y - eyeY, 1);
    const amount = v("midface") * 0.06 * u;
    const c = { x: face.noseTip.x, y: (eyeY + face.upperLip.y) / 2 };
    fields.push({
      c,
      radius: 1.4 * u,
      move: (_dx, dy) => {
        const y = c.y + dy;
        const t = Math.min(Math.max((y - eyeY) / span, 0), 1);
        return [0, amount * t];
      },
    });
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
function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;
const toCb = (r: number, g: number, b: number) => -0.1687 * r - 0.3313 * g + 0.5 * b;
const toCr = (r: number, g: number, b: number) => 0.5 * r - 0.4187 * g - 0.0813 * b;
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
/** 밝기 200 위는 무릎을 꺾어 흰색으로 잘리지 않게 */
const KNEE = 200;
const softKnee = (v: number) => (v <= KNEE ? v : KNEE + (255 - KNEE) * (1 - Math.exp(-(v - KNEE) / (255 - KNEE))));

/** 마스크 안 픽셀의 평균 [Y, Cb, Cr]. 머리 통계와 눈썹 통계에 쓴다 */
function maskStats(base: ImageData, mask: Float32Array, minConf = 0.8): [number, number, number] {
  const s = base.data;
  let y = 0, cb = 0, cr = 0, n = 0;
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    if (mask[i] < minConf) continue;
    y += luma(s[p], s[p + 1], s[p + 2]);
    cb += toCb(s[p], s[p + 1], s[p + 2]);
    cr += toCr(s[p], s[p + 1], s[p + 2]);
    n++;
  }
  return n ? [y / n, cb / n, cr / n] : [0, 0, 0];
}

/**
 * 얼굴 피부의 기준 색차(Cb·Cr)와 밝기 — **블러셔가 없는 자리(이마·코·턱)의 피부**다.
 *
 * 처음엔 얼굴 전체에서 "덜 붉은 절반"을 썼는데, 그 절반에 마스크 가장자리(머리·배경과 섞인 픽셀)와 그늘이
 * 들어가서 기준이 회색으로 흘렀고, 볼을 그쪽으로 되돌리니 **흑백 볼**이 됐다. 블러셔를 뺀 진짜 피부가
 * 기준이어야 되돌린 볼이 원래 피부색이 된다. `exclude`가 블러셔 자리(볼 원·띠)다. 얼굴을 못 찾았으면 전체.
 */
function skinReference(
  base: ImageData,
  mask: Float32Array,
  exclude: (x: number, y: number) => boolean,
): [number, number, number] {
  const s = base.data;
  const w = base.width;
  let cb = 0, cr = 0, y = 0, n = 0;
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    if (mask[i] < 0.9) continue;
    const px = i % w, py = (i / w) | 0;
    if (exclude(px, py)) continue;
    const r = s[p], g = s[p + 1], b = s[p + 2];
    const Y = luma(r, g, b);
    if (Y < 70 || Y > 235) continue;
    cb += toCb(r, g, b); cr += toCr(r, g, b); y += Y; n++;
  }
  return n ? [cb / n, cr / n, y / n] : [0, 0, 0];
}

/** 블러셔 자리 — 볼 원 두 개와 볼→콧잔등→볼 띠. 기준 피부를 뽑을 때 빼고, 블러셔를 뺄 때 잡는다 */
function blushZones(face: Face) {
  const cheeks = [
    { c: face.cheekL, r: face.unit * 0.5 },
    { c: face.cheekR, r: face.unit * 0.5 },
  ];
  const band = {
    c: { x: (face.cheekL.x + face.cheekR.x) / 2, y: (face.cheekL.y + face.cheekR.y) / 2 - face.unit * 0.05 },
    hw: (face.cheekR.x - face.cheekL.x) / 2 + face.unit * 0.35,
    hh: face.unit * 0.32,
  };
  const inside = (x: number, y: number) => {
    for (const k of cheeks) {
      const dx = x - k.c.x, dy = y - k.c.y;
      if (dx * dx + dy * dy < k.r * k.r * 1.3) return true;
    }
    const bx = (x - band.c.x) / band.hw, by = (y - band.c.y) / band.hh;
    return bx * bx + by * by < 1.3;
  };
  return { cheeks, band, inside };
}

/** 점이 꺾은선의 어디쯤인지 0(시작)~1(끝). 눈썹 선은 바깥→안쪽 순서라 0이 꼬리다 */
function polylineParam(x: number, y: number, line: Point[]): number {
  let best = Infinity, bestT = 0;
  const segs = line.length - 1;
  for (let i = 0; i < segs; i++) {
    const a = line[i], b = line[i + 1];
    const vx = b.x - a.x, vy = b.y - a.y;
    const len2 = vx * vx + vy * vy || 1;
    const t = clamp01(((x - a.x) * vx + (y - a.y) * vy) / len2);
    const d = Math.hypot(x - (a.x + vx * t), y - (a.y + vy * t));
    if (d < best) { best = d; bestT = (i + t) / segs; }
  }
  return bestT;
}

/** 점에서 꺾은선까지의 거리 */
function distToPolyline(x: number, y: number, line: Point[]): number {
  let best = Infinity;
  for (let i = 0; i + 1 < line.length; i++) {
    const a = line[i], b = line[i + 1];
    const vx = b.x - a.x, vy = b.y - a.y;
    const len2 = vx * vx + vy * vy || 1;
    const t = clamp01(((x - a.x) * vx + (y - a.y) * vy) / len2);
    const px = a.x + vx * t, py = a.y + vy * t;
    best = Math.min(best, Math.hypot(x - px, y - py));
  }
  return best;
}

type HairOp = { mask: Float32Array; depth: number; tint: Rgb | null; mean: [number, number, number] };
type BrowOp = {
  lines: Point[][];
  band: number;
  /** 이 y보다 아래(눈 쪽)는 눈썹이 아니다 — 눈두덩 그늘이 눈썹으로 잡히지 않게 */
  belowLimit: number[];
  /** 눈썹 색 진하기 −100~100 */
  depth: number;
  /** 머리색과 맞추기. 목표 [Cb, Cr]와 목표 밝기(고른 머리색 견본의 밝기) */
  match: { cb: number; cr: number; y: number } | null;
  /** 눈썹 픽셀의 평균 밝기 */
  meanY: number;
  skinY: number;
  /** 머리카락 마스크. 띠 안이라도 머리카락이면 눈썹이 아니다 */
  hairMask: Float32Array | null;
};
type MakeupOp = {
  skinMask: Float32Array;
  ref: [number, number, number];
  eyes: { c: Point; hw: number }[];
  cheeks: { c: Point; r: number }[];
  /** 볼에서 콧잔등을 지나 반대 볼까지 이어지는 블러셔 띠(타원). 한국식 블러셔는 이 띠 위에 얹힌다 */
  blushBand: { c: Point; hw: number; hh: number };
  mouth: { c: Point; hw: number; hh: number } | null;
  unit: number;
  /** 0~1. 얼마나 뺄 것인가 */
  liner: number;
  mascara: number;
  lip: number;
  blush: number;
};

/**
 * 출력 픽셀마다 "어디서 가져올지"를 정해 다시 샘플링한다(역방향 매핑, 쌍선형).
 * 같은 루프에서 머리·눈썹·메이크업 색을 만진다 — 두 번 돌지 않게.
 */
function render(
  src: ImageData,
  dst: ImageData,
  fields: Field[],
  hair: HairOp | null,
  brow: BrowOp | null,
  makeup: MakeupOp | null,
) {
  const { width: w, height: h, data: s } = src;
  const d = dst.data;

  // ---- 머리. 강도는 채도가 주(±50%)고 밝기는 종(±10%)이다 — "연하게"가 머리를 빛나게 하면 안 된다
  const t = hair ? hair.depth / ADJUSTMENT_RANGE : 0;
  const satK = 1 + t * 0.5;
  const lumK = 1 - t * 0.1;
  // 염색 — 머리의 평균 밝기를 고른 색의 밝기 쪽으로(85%) 옮기고, 가닥마다의 명암은 감마 압축한 비율로 남긴다.
  // 견본은 레퍼런스 사진에서 뽑은 색이라(hair-colors.ts) 채도는 90%만 누른다. 원본 픽셀을 20% 남겨 질감을 지킨다.
  const tint = hair?.tint ?? null;
  const hairMean = Math.max(hair?.mean[0] ?? 0, 8);
  const tintLumaRaw = tint ? luma(tint[0], tint[1], tint[2]) : 0;
  const targetMean = hairMean + (tintLumaRaw - hairMean) * 0.85;
  const tintSoft: Rgb | null = tint
    ? [
        tintLumaRaw + (tint[0] - tintLumaRaw) * 0.9,
        tintLumaRaw + (tint[1] - tintLumaRaw) * 0.9,
        tintLumaRaw + (tint[2] - tintLumaRaw) * 0.9,
      ]
    : null;
  const tintSoftLuma = tintSoft ? Math.max(luma(tintSoft[0], tintSoft[1], tintSoft[2]), 8) : 1;
  const TEXTURE_KEEP = 0.2;

  // ---- 메이크업. 피부 기준색 쪽으로 되돌린다. 밝기는 손대지 않는다(창백·흑백 방지)
  const cbRef = makeup?.ref[0] ?? 0;
  const crRef = makeup?.ref[1] ?? 0;
  const skinY = makeup?.ref[2] ?? 0;
  const DEV_LO = 2.5, DEV_HI = 12;
  // 블러셔는 색차가 옅다. 볼 안에서는 문턱을 더 낮춰서 끝까지 내리면 거의 사라지게
  const CHEEK_DEV_LO = 1.2, CHEEK_DEV_HI = 5;
  const LIP_MAX = 0.5; // 화장 안 한 입술도 피부보다 붉다
  const BLUSH_MAX = 0.92; // 기준이 진짜 피부라 거의 다 되돌려도 피부색이다. 8%는 볼의 자연스러운 결로 남긴다
  const LID_MAX = 0.8;
  const LINER_LIFT_MAX = 0.5; // 라인의 어두움은 절반까지만 — 생속눈썹은 남는다
  const MASCARA_LIFT_MAX = 0.6; // 길어진 속눈썹을 옅게. 피부까지 올리면 눈 위가 허옇게 뜬다

  // ---- 눈썹
  const browT = brow ? brow.depth / ADJUSTMENT_RANGE : 0;

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

      // ---- 머리카락
      if (hair && (t !== 0 || tintSoft)) {
        const a = hair.mask[y * w + x];
        if (a > 0.02) {
          let lum = luma(r, g, b);
          let hr = r, hg = g, hb = b;
          if (tintSoft) {
            const ratio = Math.pow(Math.max(lum, 1) / hairMean, 0.6);
            const newLum = softKnee(targetMean * ratio);
            const k = newLum / tintSoftLuma;
            hr = Math.min(tintSoft[0] * k, 255); hg = Math.min(tintSoft[1] * k, 255); hb = Math.min(tintSoft[2] * k, 255);
            hr = hr + (r - hr) * TEXTURE_KEEP; hg = hg + (g - hg) * TEXTURE_KEEP; hb = hb + (b - hb) * TEXTURE_KEEP;
            lum = luma(hr, hg, hb);
          }
          const nl = softKnee(lum * lumK);
          const nr = nl + (hr - lum) * satK;
          const ng = nl + (hg - lum) * satK;
          const nb = nl + (hb - lum) * satK;
          r = r + (nr - r) * a; g = g + (ng - g) * a; b = b + (nb - b) * a;
        }
      }

      // ---- 눈썹. 눈썹 선 띠 안에서 피부보다 어두운 픽셀만 눈썹 털이다
      if (brow && (browT !== 0 || brow.match)) {
        let inBand = 0;
        for (let li = 0; li < brow.lines.length; li++) {
          const line = brow.lines[li];
          if (y > brow.belowLimit[li]) continue;
          const dist = distToPolyline(x, y, line);
          if (dist >= brow.band) continue;
          // 눈썹 꼬리(바깥 끝)는 관자놀이 머리카락과 붙어 있다. 바깥 1/3에서 띠를 좁힌다
          const t = polylineParam(x, y, line);
          const taper = t < 0.33 ? 0.45 + (t / 0.33) * 0.55 : 1;
          if (dist < brow.band * taper) inBand = Math.max(inBand, 1 - (dist / (brow.band * taper)) ** 2);
        }
        // 띠 안이라도 머리카락(앞머리·관자)이면 눈썹이 아니다. 문턱을 낮춰 애매한 픽셀도 뺀다
        if (inBand > 0 && brow.hairMask && brow.hairMask[y * w + x] > 0.15) inBand = 0;
        if (inBand > 0) {
          const Y = luma(r, g, b);
          // 피부보다 확실히 어두워야 털이다. 문턱을 올려 피부 그늘·잔털은 빼고, 가중치를 제곱해 경계를 날카롭게
          const darkness = clamp01((brow.skinY - 22 - Y) / 35) ** 2;
          const wgt = inBand * darkness;
          if (wgt > 0.01) {
            let cb = toCb(r, g, b), cr = toCr(r, g, b), nY = Y;
            if (brow.match) {
              // 색차는 고른 머리색 견본으로. 밝기는 견본 밝기에 이 가닥의 명암(평균 대비 비율, 감마 압축)을 얹는다.
              // 비율은 0.6~1.5로 묶는다 — 눈썹이 검게 뭉개지지도, 빛나지도 않게
              cb = cb + (brow.match.cb - cb) * wgt;
              cr = cr + (brow.match.cr - cr) * wgt;
              const ratio = Math.min(Math.max(Math.pow(Math.max(Y, 1) / Math.max(brow.meanY, 8), 0.7), 0.6), 1.5);
              // 맞추기는 **어둡게 하지 않는다.** 검정 칩이어도 눈썹이 지금보다 검어지면 "검은 뭉텅이"가 된다.
              // 밝은 쪽(금발·애쉬)으로만 밝기를 따라가고, 어두운 쪽은 색차만 따라간다
              const target = Math.max(brow.match.y * ratio, Y);
              nY = Y + (target - Y) * wgt;
            }
            if (browT !== 0) {
              // 진하게(+): 어둡고 색 진하게. 연하게(−): 채도 빼고 피부 밝기 쪽으로 **조금만**(최대 25%)
              if (browT > 0) {
                nY = nY * (1 - 0.25 * browT * wgt);
                cb *= 1 + 0.3 * browT * wgt; cr *= 1 + 0.3 * browT * wgt;
              } else {
                const m = -browT;
                nY = nY + (brow.skinY - nY) * 0.25 * m * wgt;
                cb += (cbRef - cb) * 0.5 * m * wgt; cr += (crRef - cr) * 0.5 * m * wgt;
              }
            }
            r = nY + 1.402 * cr;
            g = nY - 0.344 * cb - 0.714 * cr;
            b = nY + 1.772 * cb;
          }
        }
      }

      // ---- 메이크업
      if (makeup) {
        const a = makeup.skinMask[y * w + x];
        let eyeball = false, lid = 0, edge = 0, lash = 0, cheek = 0, lipZ = 0;
        for (const e of makeup.eyes) {
          const dx = (x - e.c.x) / e.hw;
          const dy = (y - e.c.y) / e.hw;
          if ((dx * dx) / 1.21 + (dy * dy) / 0.3 < 1) { eyeball = true; break; }
          // 눈꺼풀 띠(섀도 색이 있는 자리) — 위로는 눈썹 직전, 아래로는 애교살까지
          const ny = dy < 0 ? dy / 1.15 : dy / 1.0;
          const d2 = (dx * dx) / 4 + ny * ny;
          if (d2 < 1) lid = Math.max(lid, 1 - d2 * d2);
          // 눈꺼풀 가장자리(아이라인 + 생속눈썹 뿌리) — 눈알 바로 바깥의 얇은 고리
          const d2e = (dx * dx) / 1.7 + (dy * dy) / 0.55;
          if (d2e < 1) edge = Math.max(edge, 1 - d2e * d2e);
          // 마스카라로 길어진 속눈썹 — 눈 위쪽, 가장자리 고리 **완전히 바깥**(d2e ≥ 1)에서 반너비 1.15배까지.
          // 고리에 가까울수록 약하게(생속눈썹 뿌리·아이라인은 그대로), 바깥 끝에서 가장 세게
          if (dy < 0 && d2e >= 1) {
            const d2l = (dx * dx) / 2.6 + (dy * dy) / 1.3;
            if (d2l < 1) lash = Math.max(lash, (1 - d2l * d2l) * clamp01((d2e - 1) / 0.5));
          }
        }
        if (!eyeball) {
          // 블러셔 자리 = 볼 원 두 개 + 볼→콧잔등→볼 띠. 콧잔등 위 블러셔도 같이 빠져야 한다
          for (const k of makeup.cheeks) {
            const dx = x - k.c.x, dy = y - k.c.y;
            const d2 = (dx * dx + dy * dy) / (k.r * k.r);
            if (d2 < 1) cheek = Math.max(cheek, (1 - d2) * (1 - d2));
          }
          {
            const bx = (x - makeup.blushBand.c.x) / makeup.blushBand.hw;
            const by = (y - makeup.blushBand.c.y) / makeup.blushBand.hh;
            const d2 = bx * bx + by * by;
            if (d2 < 1) cheek = Math.max(cheek, 1 - d2 * d2);
          }
          if (makeup.mouth) {
            const dx = (x - makeup.mouth.c.x) / (makeup.mouth.hw * 1.15);
            const dy = (y - makeup.mouth.c.y) / (makeup.mouth.hh * 1.4);
            const d2 = dx * dx + dy * dy;
            if (d2 < 1) lipZ = 1 - d2 * d2;
          }
          const cheekPull = makeup.blush * cheek * BLUSH_MAX * Math.max(a, 0.5);
          const otherPull = makeup.lip * lipZ * LIP_MAX + makeup.liner * lid * LID_MAX;
          // 아이라인은 가장자리 고리의 어두움(절반까지), 마스카라는 그 바깥 구간의 어두움(거의 다)
          const linerLift = makeup.liner * edge * LINER_LIFT_MAX;
          const mascaraLift = makeup.mascara * lash * MASCARA_LIFT_MAX;
          if (cheekPull > 0.005 || otherPull > 0.005 || linerLift > 0.005 || mascaraLift > 0.005) {
            let Y = luma(r, g, b);
            const cb = toCb(r, g, b), cr = toCr(r, g, b);
            let ncb = cb, ncr = cr;
            const dev = Math.hypot(cb - cbRef, cr - crRef);
            let pull = 0;
            if (otherPull > 0.005 && dev > DEV_LO) {
              pull = Math.min(otherPull, 1) * Math.min((dev - DEV_LO) / (DEV_HI - DEV_LO), 1);
            }
            if (cheekPull > 0.005 && dev > CHEEK_DEV_LO) {
              pull = Math.max(pull, Math.min(cheekPull, 1) * Math.min((dev - CHEEK_DEV_LO) / (CHEEK_DEV_HI - CHEEK_DEV_LO), 1));
            }
            if (pull > 0) {
              ncb = cb + (cbRef - cb) * pull;
              ncr = cr + (crRef - cr) * pull;
            }
            // 어두운 라인·속눈썹만 밝기를 올린다. 목표는 피부가 아니라 **피부보다 한참 아래**(속눈썹은 남아야 한다).
            // 밝은 픽셀은 그대로라 눈 주변이 뿌옇게 되지 않는다
            const lift = Math.max(linerLift, mascaraLift);
            if (lift > 0.005 && Y < skinY - 25) {
              const dark = Math.min((skinY - 25 - Y) / 60, 1);
              Y = Y + (skinY - 45 - Y) * lift * dark;
            }
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

/** 눈썹 띠 안의 어두운 픽셀 평균 밝기. "머리색과 맞추기"의 비율 기준 */
function browMeanLuma(base: ImageData, lines: Point[][], band: number, skinY: number): number {
  const s = base.data;
  const w = base.width;
  let sum = 0, n = 0;
  for (const line of lines) {
    const xs = line.map((p) => p.x), ys = line.map((p) => p.y);
    const x0 = Math.max(0, Math.floor(Math.min(...xs) - band)), x1 = Math.min(w - 1, Math.ceil(Math.max(...xs) + band));
    const y0 = Math.max(0, Math.floor(Math.min(...ys) - band)), y1 = Math.min(base.height - 1, Math.ceil(Math.max(...ys) + band));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (distToPolyline(x, y, line) >= band) continue;
      const p = (y * w + x) * 4;
      const Y = luma(s[p], s[p + 1], s[p + 2]);
      if (Y < skinY - 20) { sum += Y; n++; }
    }
  }
  return n ? sum / n : 60;
}

const FACE_KEYS = new Set<keyof Adjustments>([
  "eye_tilt", "eye_height", "eye_scale_x", "eye_scale_y", "brow_tilt", "brow_height", "brow_thickness",
  "nose_height", "nose_tilt", "nose_width", "midface", "jaw_vline", "chin_length",
]);
function needsFace(a: Adjustments): boolean {
  return ADJUSTMENT_KEYS.some((key) => FACE_KEYS.has(key) && (a[key] ?? 0) !== 0);
}
function idle(a: Adjustments): boolean {
  return ADJUSTMENT_KEYS.every((key) => (a[key] ?? 0) === 0);
}

type Status = "loading" | "ready" | "no-face" | "no-canvas";

export function FacePreview({
  src,
  adjustments,
  hairColor = null,
  browHairColor = null,
  className,
}: {
  src: string;
  adjustments: Adjustments;
  /** 고른 머리색 칩의 견본색(#rrggbb). 서버에 저장된 것과 같으면 null — 이미 그 색이다 */
  hairColor?: string | null;
  /** "머리색과 맞추기"의 목표. 다듬기에서 지금 선택돼 있는 머리색 칩의 견본색. 없으면 지금 머리의 평균색 */
  browHairColor?: string | null;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<ImageData | null>(null);
  const faceRef = useRef<Face | null>(null);
  const hairRef = useRef<Float32Array | null>(null);
  const skinRef = useRef<Float32Array | null>(null);
  const skinStatsRef = useRef<[number, number, number]>([0, 0, 0]);
  const hairStatsRef = useRef<[number, number, number]>([0, 0, 0]);
  const browLumaRef = useRef(60);
  const frameRef = useRef(0);
  // 상태는 src에 매인다. src가 바뀌면 그 자체로 "loading"이라 effect 안에서 setState를 부를 일이 없다.
  const [state, setState] = useState<{ src: string; status: Status }>({ src, status: "loading" });
  const status: Status = state.src === src ? state.status : "loading";

  // 이미지 한 번 올리고, 랜드마크·마스크를 한 번 찾는다. src가 바뀔 때(수정이 끝났을 때)만 다시 한다.
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
        seg.close();
        segmenter.close();
        const base = baseRef.current;
        if (hairRef.current && base) hairStatsRef.current = maskStats(base, hairRef.current);
        const lm = result.faceLandmarks[0];
        if (cancelled) return;
        if (!lm) {
          if (skinRef.current && base) skinStatsRef.current = skinReference(base, skinRef.current, () => false);
          setStatus("no-face");
          return;
        }
        const face = faceFrom(lm, w, h);
        faceRef.current = face;
        // 기준 피부는 블러셔 자리를 뺀 곳에서 — 얼굴을 알아야 뺄 수 있다
        if (skinRef.current && base) {
          skinStatsRef.current = skinReference(base, skinRef.current, blushZones(face).inside);
        }
        if (base) {
          browLumaRef.current = browMeanLuma(
            base, [face.browLineL, face.browLineR], face.unit * 0.07, skinStatsRef.current[2] || 150,
          );
        }
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
      const hairMask = hairRef.current;
      const skinMask = skinRef.current;
      const a = adjustments;
      const tint = hairColor ? hexToRgb(hairColor) : null;
      if ((idle(a) && !tint) || (!face && !hairMask && !skinMask)) {
        ctx.putImageData(base, 0, 0);
        return;
      }
      const depth = a.hair_color_depth ?? 0;
      const hair: HairOp | null =
        hairMask && (depth || tint) ? { mask: hairMask, depth, tint, mean: hairStatsRef.current } : null;

      // 눈썹이 맞출 머리색 — 다듬기에 선택돼 있는 머리색 칩의 견본색 그대로. 칩이 없으면 지금 머리의 평균색
      const matchOn = (a.brow_match_hair ?? 0) >= 50;
      let match: BrowOp["match"] = null;
      if (matchOn) {
        const target = browHairColor ? hexToRgb(browHairColor) : tint;
        if (target) {
          match = { cb: toCb(target[0], target[1], target[2]), cr: toCr(target[0], target[1], target[2]), y: luma(target[0], target[1], target[2]) };
        } else if (hairStatsRef.current[0] > 0) {
          const [hy, hcb, hcr] = hairStatsRef.current;
          match = { cb: hcb, cr: hcr, y: hy };
        }
      }
      const browDepth = a.brow_depth ?? 0;
      const brow: BrowOp | null =
        face && (browDepth || match)
          ? {
              lines: [face.browLineL, face.browLineR],
              band: face.unit * 0.07,
              // 눈 위 가장자리(눈 중심 − 반너비×0.6)보다 아래는 눈썹이 아니다
              belowLimit: [face.eyeL.y - face.eyeHalfWidth * 0.6, face.eyeR.y - face.eyeHalfWidth * 0.6],
              depth: browDepth,
              match,
              meanY: browLumaRef.current,
              skinY: skinStatsRef.current[2] || 150,
              hairMask,
            }
          : null;

      const lighter = (key: keyof Adjustments) => clamp01(-(a[key] ?? 0) / ADJUSTMENT_RANGE);
      const liner = lighter("makeup_liner"), mascara = lighter("makeup_mascara");
      const lip = lighter("makeup_lip"), blush = lighter("makeup_blush");
      const makeup: MakeupOp | null =
        skinMask && face && (liner || mascara || lip || blush)
          ? {
              skinMask,
              ref: skinStatsRef.current,
              eyes: [
                { c: face.eyeL, hw: face.eyeHalfWidth },
                { c: face.eyeR, hw: face.eyeHalfWidth },
              ],
              cheeks: blushZones(face).cheeks,
              mouth: { c: face.mouth, hw: face.mouthHalfWidth, hh: face.mouthHalfHeight },
              blushBand: blushZones(face).band,
              unit: face.unit,
              liner, mascara, lip, blush,
            }
          : null;

      const out = ctx.createImageData(base.width, base.height);
      render(base, out, face && needsFace(a) ? fieldsFor(face, a) : [], hair, brow, makeup);
      ctx.putImageData(out, 0, 0);
    });
    return () => cancelAnimationFrame(frameRef.current);
  }, [adjustments, hairColor, browHairColor, status]);

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
