import assert from "node:assert/strict";
import test from "node:test";
import { characterViewPlan } from "../supabase/functions/_shared/character-views.ts";
import { VIDEO_MODEL, videoEditInput, resultUrl } from "../supabase/functions/_shared/fal.ts";

test("completion reuses the applied face exactly; only the side views require AI", () => {
  const refined = "owner/character/refinement-round-3.jpg";
  const plan = characterViewPlan(refined);
  const saved = plan.filter((row) => row.status === "done");
  const toGenerate = plan.filter((row) => row.status === "queued");
  assert.deepEqual(saved, [{ angle: "front", status: "done", image_path: refined }]);
  assert.deepEqual(toGenerate.map((row) => row.angle), ["left45", "right45"]);
  assert.ok(toGenerate.every((row) => row.image_path === null));
  assert.equal(plan.length, 3); // SQL batch completeness still requires all three views.
});

test("callback accepts documented fal output storage without allowing arbitrary hosts or buckets", () => {
  for (const url of ["https://fal.media/files/result.mp4", "https://v3.fal.media/result.mp4", "https://storage.googleapis.com/falserverless/example_outputs/vace-video-edit-output.mp4"]) {
    assert.equal(resultUrl({ video: { url } }), url);
  }
  for (const url of ["http://fal.media/result.mp4", "https://fal.media.evil.example/result.mp4", "https://storage.googleapis.com/other-bucket/result.mp4", "https://storage.googleapis.com/falserverless/../other/result.mp4", "https://user:secret@fal.media/result.mp4", "https://127.0.0.1/result.mp4"]) {
    assert.equal(resultUrl({ video: { url } }), null);
  }
  assert.equal(resultUrl({}), null);
});

test("completion respects an explicitly restored earlier face rather than the newest generated file", () => {
  const restored = "owner/character/chosen-candidate.jpg";
  assert.equal(characterViewPlan(restored)[0].image_path, restored);
  assert.throws(() => characterViewPlan(""), /CHARACTER_NOT_READY/);
  assert.throws(() => characterViewPlan("   "), /CHARACTER_NOT_READY/);
});

test("video conversion uses a prompt-capable editor with the original video and canonical face", () => {
  const video = "https://storage.example/source.mp4";
  const face = "https://storage.example/applied-face.jpg";
  const input = videoEditInput(video, face);
  assert.equal(VIDEO_MODEL, "fal-ai/wan-vace-apps/video-edit");
  assert.equal(input.video_url, video);
  assert.deepEqual(input.image_urls, [face]);
  // This is the documented VACE request contract, not Animate Replace's schema.
  assert.deepEqual(Object.keys(input).sort(), [
    "acceleration", "aspect_ratio", "enable_safety_checker", "image_urls",
    "prompt", "resolution", "video_type", "video_url",
  ]);
  assert.equal(input.enable_safety_checker, true);
  assert.equal(input.video_type, "human");
  assert.equal(input.resolution, "720p");
  assert.equal(input.aspect_ratio, "auto");
  assert.match(input.prompt, /face and hair/);
  assert.match(input.prompt, /clothing and accessories exactly unchanged in every frame/);
  assert.match(input.prompt, /ignore its clothing/);
  assert.match(input.prompt, /do not replace or restyle the body/);
});
