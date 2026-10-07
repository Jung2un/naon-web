/** The saved, applied face is the canonical front view; never regenerate it. */
export function characterViewPlan(baseImagePath: string) {
  if (!baseImagePath.trim()) throw new Error("CHARACTER_NOT_READY");
  return [
    { angle: "front" as const, status: "done" as const, image_path: baseImagePath },
    { angle: "left45" as const, status: "queued" as const, image_path: null },
    { angle: "right45" as const, status: "queued" as const, image_path: null },
  ];
}
