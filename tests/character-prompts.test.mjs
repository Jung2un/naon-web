import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { draftPrompt, editInstruction, viewInstruction } from "../supabase/functions/_shared/prompt.ts";

// Load the actual migration text so the tone used in tests matches the DB update.
const migration = readFileSync(new URL("../supabase/migrations/20260920000001_portrait_tone_prompts.sql", import.meta.url), "utf8");
const tones = [...migration.matchAll(/\('([^']+)'::uuid,\s*'([^']+)'\)/g)].map(([, id, prompt]) => ({ id, kind: "tone", name: id, prompt }));
const ageId = n => `a3333333-0000-4000-8000-00000000000${n}`;
const genderId = n => `a2222222-0000-4000-8000-00000000000${n}`;
const ages = ["in their early twenties", "in their late twenties", "in their thirties", "in their forties", "in their fifties"];
const genders = { [genderId(1)]: "a woman", [genderId(2)]: "a man", [genderId(3)]: "an androgynous person" };
function fixture(ageIndex = 0, gender = genderId(3)) {
  const options = new Map([
    ...Object.entries(genders).map(([id, prompt]) => [id, { id, kind: "gender", prompt }]),
    ["hair", { id: "hair", kind: "hair", prompt: "a short cropped cut" }],
    ["color", { id: "color", kind: "hair_color", prompt: "pink brown hair" }],
    ["body", { id: "body", kind: "body", prompt: "a curvy body type" }],
    ["vibe", { id: "vibe", kind: "vibe", prompt: "a cool and chic look" }],
    ...ages.map((prompt, i) => [ageId(i + 1), { id: ageId(i + 1), kind: "age", prompt }]),
  ]);
  return { options, traits: { gender, age: ageId(ageIndex + 1), hair: "hair", hair_color: "color", body: "body", vibe: "vibe" } };
}
const parse = prompt => JSON.parse(prompt);
// Words that pull the model toward a generic "too perfect" AI face. Tone prose from the DB is excluded.
const CLICHES = /\b(beautiful|gorgeous|flawless|stunning|perfect|pretty|handsome)\b/i;
const withoutTone = (request) => JSON.stringify({ ...request, scene: { ...request.scene, description: "" } });

test("the request is structured JSON: fixed identity, variable scene and styling, photographic realism block", () => {
  assert.equal(tones.length, 4);
  const { traits, options } = fixture();
  const settings = ["window daylight", "blue hour", "minimal studio", "quiet cafe"];
  tones.forEach((tone, index) => {
    const request = parse(draftPrompt(tone, traits, options));
    assert.equal(request.scene.description, tone.prompt);
    assert.ok(request.scene.description.includes(settings[index]));
    assert.deepEqual(Object.keys(request), ["task", "scene", "subject", "camera_technical", "avoid", "output"]);
    assert.deepEqual(Object.keys(request.subject), ["identity_fixed", "presentation", "styling"]);
    assert.ok(request.camera_technical.composition.includes("Vertical 3:4"));
    assert.doesNotMatch(draftPrompt(tone, traits, options), /plain neutral background/);
    // Vocabulary the realism direction depends on.
    for (const term of ["natural skin texture", "Muted neutral color palette", "editorial and lifestyle photography", "shallow depth of field", "Photorealistic", "candid", "understated"]) {
      assert.ok(JSON.stringify(request.camera_technical).includes(term), term);
    }
  });
});

test("every age and gender selection survives; youthful treatment is limited to the twenties", () => {
  for (let ageIndex = 0; ageIndex < ages.length; ageIndex++) {
    for (const [id, gender] of Object.entries(genders)) {
      const { traits, options } = fixture(ageIndex, id);
      const request = parse(draftPrompt(tones[0], traits, options));
      const identity = request.subject.identity_fixed;
      assert.equal(identity.gender, gender);
      assert.equal(identity.age, ages[ageIndex]);
      assert.equal(identity.hair, "a short cropped cut, pink brown hair");
      assert.equal(identity.build, "a curvy body type");
      assert.ok(request.scene.mood.startsWith("a cool and chic look"));
      assert.equal(identity.age_direction.includes("adult in their twenties"), ageIndex < 2);
      if (ageIndex >= 2) assert.ok(identity.age_direction.includes("age-appropriate"));
    }
  }
});

test("presentation is written per gender, and none of it leans on beauty cliches", () => {
  const { options } = fixture();
  const presentation = gender => parse(draftPrompt(tones[0], { ...fixture(0, gender).traits }, options)).subject.presentation;
  const woman = presentation(genderId(1));
  const man = presentation(genderId(2));
  const neutral = presentation(genderId(3));
  assert.equal(new Set([woman, man, neutral]).size, 3);
  assert.match(woman, /subtle makeup/);
  assert.match(man, /masculine features/);
  assert.match(man, /grooming/);
  assert.match(neutral, /androgynous/);
  assert.doesNotMatch(neutral, /makeup and natural lip/);
  for (const text of [woman, man, neutral]) {
    assert.match(text, /realistic (skin )?texture|fine pores/i);
    assert.doesNotMatch(text, CLICHES);
  }
  // Unknown gender ids fall back to a neutral direction instead of undefined.
  const other = parse(draftPrompt(tones[0], { gender: "custom", age: ageId(1) }, new Map([...options, ["custom", { id: "custom", kind: "gender", prompt: "a person" }]])));
  assert.match(other.subject.presentation, /individual character/);
  for (const tone of tones) {
    for (const gender of Object.keys(genders)) {
      assert.doesNotMatch(withoutTone(parse(draftPrompt(tone, fixture(2, gender).traits, options))), CLICHES);
    }
  }
});

test("anime, 3D and new catalog tones do not inherit photographic skin or lens instructions", () => {
  const { traits, options } = fixture(3, genderId(1));
  const illustrated = [
    { id: "a1111111-0000-4000-8000-000000000005", prompt: "anime illustration, clean line art, cel shading" },
    { id: "a1111111-0000-4000-8000-000000000006", prompt: "stylized 3d character render" },
    { id: "custom", prompt: "watercolor portrait" },
  ];
  for (const tone of illustrated) {
    const prompt = draftPrompt({ ...tone, kind: "tone", name: tone.id }, traits, options);
    const request = parse(prompt);
    assert.equal(request.scene.description, tone.prompt);
    assert.equal(request.camera_technical, undefined);
    assert.ok(request.rendering.medium.includes("illustrated or 3D medium"));
    // Positive direction carries no photographic vocabulary; only the avoid list may name it as a negative.
    const positive = structuredClone(request);
    delete positive.avoid;
    delete positive.rendering.medium;
    positive.scene.description = "";
    assert.doesNotMatch(JSON.stringify(positive), /50mm|85mm|softbox|skin texture|pores|photorealistic|photograph/i);
    assert.match(request.avoid.join(" "), /photographic skin pores/);
    // Gender direction still applies, minus the photographic skin sentence.
    assert.match(request.subject.presentation, /subtle makeup/);
  }
});

test("four casting variants vary only the face and keep identical selections and scene", () => {
  const { traits, options } = fixture();
  const requests = Array.from({ length: 4 }, (_, i) => parse(draftPrompt(tones[0], traits, options, i)));
  assert.equal(new Set(requests.map(r => r.subject.identity_fixed.face)).size, 4);
  const stable = requests.map(request => {
    const copy = structuredClone(request);
    delete copy.subject.identity_fixed.face;
    return JSON.stringify(copy);
  });
  assert.equal(new Set(stable).size, 1);
});

test("optional traits are omitted cleanly and identity-preserving edits remain unchanged", () => {
  const { options } = fixture();
  const minimal = { gender: genderId(2), age: ageId(1) };
  const prompt = draftPrompt(tones[0], minimal, options);
  assert.doesNotMatch(prompt, /undefined|pink brown hair|curvy/);
  const identity = parse(prompt).subject.identity_fixed;
  assert.equal(identity.hair, undefined);
  assert.equal(identity.build, undefined);
  assert.equal(editInstruction(minimal, minimal, options), null);
  const edit = editInstruction(minimal, { ...minimal, hair: "hair" }, options);
  assert.ok(edit.includes("keep the same person, the same face and identity"));
  assert.ok(viewInstruction("left45").includes("45 degrees to the left"));
});
