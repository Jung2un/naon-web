import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { draftPrompt, editInstruction, viewInstruction } from "../supabase/functions/_shared/prompt.ts";

// Load the actual migration text so the tone used in tests matches the DB update.
const migration = readFileSync(new URL("../supabase/migrations/20260920000001_portrait_tone_prompts.sql", import.meta.url), "utf8");
const tones = [...migration.matchAll(/\('([^']+)'::uuid,\s*'([^']+)'\)/g)].map(([, id, prompt]) => ({ id, kind: "tone", name: id, prompt }));
const ageId = n => `a3333333-0000-4000-8000-00000000000${n}`;
const ages = ["in their early twenties", "in their late twenties", "in their thirties", "in their forties", "in their fifties"];
function fixture(ageIndex = 0, gender = "an androgynous person") {
  const options = new Map([
    ["gender", { id: "gender", kind: "gender", prompt: gender }],
    ["hair", { id: "hair", kind: "hair", prompt: "a short cropped cut" }],
    ["color", { id: "color", kind: "hair_color", prompt: "pink brown hair" }],
    ["body", { id: "body", kind: "body", prompt: "a curvy body type" }],
    ["vibe", { id: "vibe", kind: "vibe", prompt: "a cool and chic look" }],
    ...ages.map((prompt, i) => [ageId(i + 1), { id: ageId(i + 1), kind: "age", prompt }]),
  ]);
  return { options, traits: { gender: "gender", age: ageId(ageIndex + 1), hair: "hair", hair_color: "color", body: "body", vibe: "vibe" } };
}

test("all photographic tones retain their own lighting and setting without a generic background override", () => {
  assert.equal(tones.length, 4);
  const { traits, options } = fixture();
  const settings = ["window daylight", "blue hour", "minimal studio", "quiet cafe"];
  tones.forEach((tone, index) => {
    const prompt = draftPrompt(tone, traits, options);
    assert.ok(prompt.includes(tone.prompt));
    assert.ok(prompt.includes(settings[index]));
    assert.ok(!prompt.includes("plain neutral background"));
    assert.ok(prompt.includes("vertical 3:4"));
  });
});

test("every age and gender selection survives; youthful treatment is limited to the twenties", () => {
  for (let ageIndex = 0; ageIndex < ages.length; ageIndex++) {
    for (const gender of ["a woman", "a man", "an androgynous person"]) {
      const { traits, options } = fixture(ageIndex, gender);
      const prompt = draftPrompt(tones[0], traits, options);
      assert.ok(prompt.includes(`SUBJECT — required user choices: ${gender}, ${ages[ageIndex]}`));
      assert.ok(prompt.includes("pink brown hair, a curvy body type, a cool and chic look"));
      assert.equal(prompt.includes("fresh, healthy adult in their twenties"), ageIndex < 2);
      if (ageIndex >= 2) assert.ok(prompt.includes("Keep natural age-appropriate features"));
    }
  }
});

test("anime, 3D and new catalog tones do not inherit photographic skin or lens instructions", () => {
  const { traits, options } = fixture(3);
  for (const medium of ["anime illustration, clean line art, cel shading", "stylized 3d character render", "watercolor portrait"]) {
    const prompt = draftPrompt({ id: "custom", kind: "tone", prompt: medium }, traits, options);
    assert.ok(prompt.includes(medium));
    assert.doesNotMatch(prompt, /50mm|85mm|softbox|skin texture|photorealistic/);
  }
});

test("four casting variants vary the face but preserve identical requested attributes", () => {
  const { traits, options } = fixture();
  const prompts = Array.from({ length: 4 }, (_, i) => draftPrompt(tones[0], traits, options, i));
  assert.equal(new Set(prompts).size, 4);
  const subjects = prompts.map(prompt => prompt.split("\n\n")[1]);
  assert.equal(new Set(subjects).size, 1);
});

test("optional traits are omitted cleanly and identity-preserving edits remain unchanged", () => {
  const { options } = fixture();
  const minimal = { gender: "gender", age: ageId(1) };
  const prompt = draftPrompt(tones[0], minimal, options);
  assert.doesNotMatch(prompt, /undefined|pink brown hair/);
  assert.equal(editInstruction(minimal, minimal, options), null);
  const edit = editInstruction(minimal, { ...minimal, hair: "hair" }, options);
  assert.ok(edit.includes("keep the same person, the same face and identity"));
  assert.ok(viewInstruction("left45").includes("45 degrees to the left"));
});
