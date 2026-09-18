import { assertEquals, assertRejects } from "jsr:@std/assert";
import { mp4Duration, readLimited, validSourcePath } from "./video.ts";
import { resultUrl, signToken, verifyToken } from "./fal.ts";
import { generateImage, GenerationError, imageFrom } from "./gemini.ts";

function mp4(seconds: number, version = 0) {
  const payload = new Uint8Array(version ? 32 : 20);
  const view = new DataView(payload.buffer);
  payload[0] = version;
  view.setUint32(version ? 20 : 12, 1000);
  if (version) view.setBigUint64(24, BigInt(seconds * 1000));
  else view.setUint32(16, seconds * 1000);
  const atom = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(8 + data.length);
    new DataView(out.buffer).setUint32(0, out.length);
    out.set(new TextEncoder().encode(type), 4);
    out.set(data, 8);
    return out;
  };
  const ftyp = atom("ftyp", new TextEncoder().encode("isom0000"));
  const moov = atom("moov", atom("mvhd", payload));
  const all = new Uint8Array(ftyp.length + moov.length);
  all.set(ftyp);
  all.set(moov, ftyp.length);
  return all.buffer;
}
Deno.test("server reads both MP4 duration versions and rejects malformed sizes", () => {
  assertEquals(mp4Duration(mp4(5)), 5);
  assertEquals(mp4Duration(mp4(9, 1)), 9);
  assertEquals(mp4Duration(new ArrayBuffer(4)), null);
  const bad = mp4(5);
  new DataView(bad).setUint32(16, 0xffffffff);
  assertEquals(mp4Duration(bad), null);
});
Deno.test("upload path cannot escape owner or refer to another job", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  assertEquals(validSourcePath("owner", id, `owner/${id}/source.mp4`), true);
  assertEquals(validSourcePath("owner", id, `other/${id}/source.mp4`), false);
  assertEquals(validSourcePath("owner", id, "owner/../source.mp4"), false);
});
Deno.test("result downloader accepts only explicit fal video output", () => {
  assertEquals(
    resultUrl({ video: { url: "https://v3b.fal.media/files/result.mp4" } }),
    "https://v3b.fal.media/files/result.mp4",
  );
  for (
    const url of [
      "http://v3b.fal.media/a",
      "https://fal.media.evil.test/a",
      "https://localhost/a",
      "https://user:pass@fal.media/a",
    ]
  ) assertEquals(resultUrl({ video: { url } }), null);
  assertEquals(resultUrl({ url: "https://fal.media/a" }), null);
});
Deno.test("callback HMAC cannot be reused on a different job", async () => {
  Deno.env.set("WEBHOOK_SECRET", "test-only-secret");
  const token = await signToken("job", "one");
  assertEquals(await verifyToken("job", "one", token), true);
  assertEquals(await verifyToken("job", "two", token), false);
});
Deno.test("bounded download rejects streaming response larger than maximum", async () => {
  await assertRejects(() => readLimited(new Response(new Uint8Array(20)), 10));
  assertEquals(
    (await readLimited(new Response(new Uint8Array(4)), 10)).byteLength,
    4,
  );
});
Deno.test("Gemini parses documented outputs and rejects unrelated base64", () => {
  const image = { data: "aGVsbG8=", mime_type: "image/png" };
  assertEquals(imageFrom({ output_image: image })?.mimeType, "image/png");
  assertEquals(
    imageFrom({
      steps: [{ type: "model_output", content: [{ type: "image", ...image }] }],
    })?.data,
    image.data,
  );
  assertEquals(imageFrom({ random: image }), null);
  assertEquals(
    imageFrom({ output_image: { ...image, mime_type: "text/html" } }),
    null,
  );
});
Deno.test("Gemini API adapter sends reference image and maps quota without paid calls", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = (_input, init) => {
      const body = JSON.parse(String(init?.body));
      assertEquals(body.model, "test-model");
      assertEquals(body.input[1].type, "image");
      assertEquals(body.response_format.aspect_ratio, "3:4");
      return Promise.resolve(
        new Response(
          JSON.stringify({
            output_image: { data: "aGVsbG8=", mime_type: "image/png" },
          }),
          { status: 200 },
        ),
      );
    };
    assertEquals(
      (await generateImage({ key: "fake", model: "test-model" }, {
        prompt: "test",
        image: { data: "aGVsbG8=", mimeType: "image/png" },
      })).bytes.byteLength,
      5,
    );
    globalThis.fetch = () =>
      Promise.resolve(new Response("quota", { status: 429 }));
    const error = await assertRejects(
      () =>
        generateImage({ key: "fake", model: "test-model" }, { prompt: "test" }),
      GenerationError,
    );
    assertEquals(error.code, "RATE_LIMITED");
  } finally {
    globalThis.fetch = original;
  }
});
