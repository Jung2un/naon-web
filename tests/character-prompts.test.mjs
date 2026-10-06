import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { asAdjustments, draftPrompt, editInstruction, lookInstruction, viewInstruction } from "../supabase/functions/_shared/prompt.ts";

// Load the actual migration text so the tone used in tests matches the DB update.
const migration = readFileSync(new URL("../supabase/migrations/20260922000001_tone_prompts_scene_depth.sql", import.meta.url), "utf8");
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
    assert.deepEqual(Object.keys(request.subject), ["identity_fixed", "casting", "presentation", "styling"]);
    // Casting level is its own axis. Without it the direction to stay "natural" produced plain, unstyled people.
    assert.match(request.subject.casting, /Instagram fashion influencer/);
    assert.match(request.subject.casting, /Aspirational rather than ordinary/);
    assert.ok(request.camera_technical.composition.includes("Vertical 3:4"));
    assert.doesNotMatch(draftPrompt(tone, traits, options), /plain neutral background/);
    // Vocabulary the realism direction depends on.
    for (const term of ["high-frequency skin texture", "editorial and lifestyle photography", "shallow depth of field", "Photorealistic", "candid", "understated"]) {
      assert.ok(JSON.stringify(request.camera_technical).includes(term), term);
    }
    // Color belongs to the tone. A shared "muted neutral" grade turned every tone grey.
    assert.doesNotMatch(JSON.stringify(request.camera_technical), /muted neutral/i);
    assert.match(request.camera_technical.color, /Commit to the color and light described in the scene/);
    // The framing brief that produced passport photos is gone, and the rig stays out of shot.
    assert.doesNotMatch(request.camera_technical.composition, /comfortable headroom|nearly forward/);
    assert.match(request.avoid.join(" "), /passport or ID-photo framing/);
    assert.match(request.avoid.join(" "), /softbox, light stand/);
  });
});

test("tone prose describes light, never the equipment making it", () => {
  for (const tone of tones) {
    assert.doesNotMatch(tone.prompt, /softbox|light stand|reflector panel|strobe|tripod/i);
    // Every photographic tone puts something behind the person for the light to fall on.
    assert.match(tone.prompt, /wall|window|bokeh|behind the person/i);
  }
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
      // Each bracket names the actual years and blocks both directions.
      assert.ok(identity.age_direction.includes(["Aged 21 to 24", "Aged 25 to 29", "Aged 30 to 39", "Aged 40 to 49", "Aged 50 or older"][ageIndex]), identity.age_direction);
      assert.match(identity.age_direction, /hard requirement/);
    }
  }
});

test("casting level is one axis and realism is another; neither cancels the other", () => {
  const { traits, options } = fixture(1, genderId(1));
  const request = parse(draftPrompt(tones[0], traits, options));
  // Grooming went up...
  assert.match(request.subject.presentation, /salon-cut hair/i);
  assert.match(request.subject.presentation, /brows/);
  assert.match(request.subject.styling.wardrobe, /well-fitted/);
  // ...while every anti-plastic instruction stayed.
  assert.match(request.subject.presentation, /fine pores/);
  assert.match(request.subject.presentation, /No plastic or waxy smoothing/);
  assert.match(request.avoid.join(" "), /plastic, waxy or overly smooth skin/);
  // The direction that made them ordinary is gone from every field.
  assert.doesNotMatch(withoutTone(request), /idealized/i);
  assert.match(request.avoid.join(" "), /plain unstyled casting/);
});

test("each age bracket is directed on its own; an early-twenties pick cannot come back as a thirties face", () => {
  const { options } = fixture();
  const direction = i => parse(draftPrompt(tones[0], fixture(i, genderId(1)).traits, options)).subject.identity_fixed.age_direction;
  // Five brackets, five different directions — the old code had one string for all of the twenties.
  assert.equal(new Set([0, 1, 2, 3, 4].map(direction)).size, 5);
  // The young brackets have to exclude the markers that made a 21-year-old read as mid-thirties.
  for (const i of [0, 1]) {
    assert.match(direction(i), /no nasolabial folds/);
    assert.match(direction(i), /no under-eye (shadows or hollows|hollows)/);
  }
  assert.match(direction(0), /must not read a day older/);
  assert.match(direction(1), /must not read as thirty or older/);
  // The older brackets must not be smoothed back down either.
  assert.match(direction(3), /Do not smooth the age back into the thirties/);
  assert.match(direction(4), /Do not render this person as a thirties or forties face/);
  // Styling must follow the age instead of ageing the person up.
  assert.match(direction(0), /Grooming, styling and makeup follow that age/);
  // An unknown age id still gets a direction rather than undefined.
  assert.match(parse(draftPrompt(tones[0], { gender: genderId(1), age: "custom" }, new Map([...options, ["custom", { id: "custom", kind: "age", prompt: "an adult" }]]))).subject.identity_fixed.age_direction, /neither younger nor older/);
});

test("presentation is written per gender, and none of it leans on beauty cliches", () => {
  const { options } = fixture();
  const presentation = gender => parse(draftPrompt(tones[0], { ...fixture(0, gender).traits }, options)).subject.presentation;
  const woman = presentation(genderId(1));
  const man = presentation(genderId(2));
  const neutral = presentation(genderId(3));
  assert.equal(new Set([woman, man, neutral]).size, 3);
  assert.match(woman, /Korean makeup in a cool, low-saturation palette/);
  assert.match(man, /masculine features/);
  assert.match(man, /no makeup at all/);
  assert.match(neutral, /androgynous/);
  assert.doesNotMatch(neutral, /tinted natural lip/);
  // Every gender is cast and groomed at the same level; only the vocabulary differs.
  for (const text of [woman, man, neutral]) {
    assert.match(text, /(fine|visible) pores/i);
    assert.match(text, /brows/);
    assert.match(text, /haircut|hair that/i);
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
    // Gender direction and casting still apply, minus the photographic skin sentence.
    assert.match(request.subject.presentation, /Korean makeup in a cool, low-saturation palette/);
    assert.match(request.subject.presentation, /Salon-cut hair/);
    assert.doesNotMatch(request.subject.presentation, /pores/);
    assert.match(request.subject.casting, /Instagram fashion influencer/);
  }
});

test("four candidates vary only the face; the shoot is identical so the grid can be compared", () => {
  const { traits, options } = fixture();
  const requests = Array.from({ length: 4 }, (_, i) => parse(draftPrompt(tones[0], traits, options, i)));
  assert.equal(new Set(requests.map(r => r.subject.identity_fixed.face)).size, 4);
  const stable = requests.map(request => {
    const copy = structuredClone(request);
    delete copy.subject.identity_fixed.face;
    return JSON.stringify(copy);
  });
  assert.equal(new Set(stable).size, 1);
  // Varying angle and gaze made the grid hard to choose from: you end up comparing
  // photographs instead of faces. Every candidate faces the camera the same way.
  for (const request of requests) {
    assert.match(request.camera_technical.composition, /faces the camera straight on/);
    assert.match(request.camera_technical.composition, /looking directly into the lens/);
    assert.match(request.camera_technical.composition, /compared side by side/);
    assert.doesNotMatch(request.camera_technical.composition, /three-quarter|off-camera|turned/i);
  }
});

test("skin is evened out without being smoothed, and stays free of casts and invented marks", () => {
  const { options } = fixture();
  for (const gender of Object.keys(genders)) {
    const request = parse(draftPrompt(tones[0], fixture(1, gender).traits, options));
    const skin = request.subject.presentation;
    // Blotchy output came from asking for tonal variation while also asking for texture.
    assert.doesNotMatch(skin, /natural tonal variation|slight unevenness/);
    assert.match(skin, /even tone/);
    assert.match(skin, /high-frequency texture/);
    assert.match(skin, /no mottled or blotchy patches/);
    assert.match(skin, /no invented blemishes/);
    // Evening out the tone must not become airbrushing.
    assert.match(skin, /No plastic or waxy smoothing/);
    assert.match(skin, /pores/);
  }
  const request = parse(draftPrompt(tones[0], fixture(1, genderId(1)).traits, options));
  assert.match(request.camera_technical.color, /5500K/);
  assert.match(request.camera_technical.retouching, /preserving high-frequency skin texture/);
  assert.match(request.camera_technical.capture, /crisp focus on the eyes/);
  assert.match(request.avoid.join(" "), /mottled, blotchy or patchy skin tone/);
  assert.match(request.avoid.join(" "), /yellow, orange or green colour cast/);
});

test("the makeup palette is cool-toned; warm coral direction is what turned the faces orange", () => {
  const { options } = fixture();
  const woman = parse(draftPrompt(tones[0], fixture(1, genderId(1)).traits, options)).subject.presentation;
  // Cool rose / mauve / dusty pink / taupe, grey-brown liner, ash brows, glossy cool lip.
  for (const term of [/cool rose, mauve, dusty pink and soft taupe/, /grey-brown rather than black/, /mauve-taupe on the lid/, /ash-brown brows/, /sheer cool pink lip tint/, /aegyo-sal/, /dewy skin-like base/]) {
    assert.match(woman, term);
  }
  // Blush is the field that actually produced the coloured faces: it must be sheer and low, not a cheekbone sweep.
  assert.match(woman, /narrow band just under the eyes/);
  assert.match(woman, /never a sweep across the cheekbones/);
  // Listing the steps without an intensity cap got every step applied at full strength.
  assert.match(woman, /Keep the whole face barely-there/);
  assert.match(woman, /not someone wearing a full face of makeup/);
  assert.match(woman, /almost imperceptible/);
  assert.match(woman, /If in doubt, apply less/);
  assert.match(parse(draftPrompt(tones[0], fixture(1, genderId(1)).traits, options)).avoid.join(" "), /a full face of makeup/);
  // Warm vocabulary must be gone from the positive direction entirely.
  assert.doesNotMatch(woman, /peach-rose|coral blush|glossy coral|warm peach/i);
  assert.match(woman, /never coral, peach or orange/i);
  // The references are all women. Men and androgynous characters wear what people of that
  // presentation actually go out in — skincare and tidy brows, no applied colour.
  for (const gender of [genderId(2), genderId(3)]) {
    const other = parse(draftPrompt(tones[0], fixture(1, gender).traits, options)).subject.presentation;
    // Their own text says "no blush", so match her positive wording, not the bare word.
    assert.doesNotMatch(other, /Blush is barely there|glossy cool pink|mauve-taupe wash|aegyo-sal|tightlined/i);
    assert.match(other, /no makeup at all|essentially no makeup/);
    assert.match(other, /skincare/);
    assert.match(other, /clean natural brows/i);
  }
  // The shared eye brief must not smuggle makeup back into those characters.
  const eyes = parse(draftPrompt(tones[0], fixture(1, genderId(2)).traits, options)).subject.presentation;
  assert.match(eyes, /Do not add makeup to a character whose grooming says they wear none/);
});

test("complexion is pinned per gender, away from porcelain and away from a flushed red", () => {
  const { options } = fixture();
  const shade = gender => parse(draftPrompt(tones[0], fixture(1, gender).traits, options)).subject.presentation;
  // Women 19-21 (toward 21), men 21-23, androgynous around 21.
  assert.match(shade(genderId(1)), /Complexion depth: Korean foundation shade 19 to 21, toward the 21 end/);
  assert.match(shade(genderId(2)), /Complexion depth: Korean foundation shade 21 to 23/);
  assert.match(shade(genderId(3)), /Complexion depth: Korean foundation shade 21 as the reference point/);
  for (const gender of Object.keys(genders)) {
    const presentation = shade(gender);
    // The guards are gender-common: both ends have to be blocked.
    assert.match(presentation, /Never porcelain-white, bleached or grey-pale/);
    assert.match(presentation, /never a ruddy, flushed or sunburnt red/);
    // Skin tone and makeup tone are separate: cool makeup must not bleach the skin.
    assert.match(presentation, /does not lighten or change the skin tone itself/);
  }
  const request = parse(draftPrompt(tones[0], fixture(1, genderId(1)).traits, options));
  assert.match(request.avoid.join(" "), /coral, peach or orange makeup of any kind/);
  assert.match(request.avoid.join(" "), /porcelain-white, bleached or grey-pale skin/);
  // Illustrated media get neither brief.
  const anime = parse(draftPrompt({ id: "a1111111-0000-4000-8000-000000000005", kind: "tone", name: "anime", prompt: "anime illustration" }, fixture(1, genderId(1)).traits, options));
  assert.doesNotMatch(anime.subject.presentation, /Korean foundation shade/);
});

test("the eyes are enlarged with makeup and light, never with anatomy", () => {
  const { options } = fixture();
  for (const gender of Object.keys(genders)) {
    const request = parse(draftPrompt(tones[0], fixture(1, gender).traits, options));
    assert.match(request.subject.presentation, /must read large, open and bright/);
    assert.match(request.subject.presentation, /lash/);
    assert.match(request.subject.presentation, /round and wide open rather than elongated into a cat-eye/);
    // The guard that keeps it out of doll-eye territory.
    assert.match(request.subject.presentation, /eye socket, iris size, lid structure and inner-corner shape stay those of a real Korean adult/);
    // The old blanket ban contradicted the request and has to stay gone.
    assert.doesNotMatch(request.subject.presentation, /no enlarged eyes/);
  }
  // Illustrated media already carry large eyes; the photographic eye brief stays out of them.
  const anime = parse(draftPrompt({ id: "a1111111-0000-4000-8000-000000000005", kind: "tone", name: "anime", prompt: "anime illustration" }, fixture(1, genderId(1)).traits, options));
  assert.doesNotMatch(anime.subject.presentation, /must read large, open and bright/);
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
  assert.ok(viewInstruction("left45").includes("45 degrees toward the viewer's LEFT"));
});

// "turned to the left" alone drew both side views the same way — whose left was never said.
// The two phrases must name the viewer as the reference and be mirror images of each other.
test("left and right 45° views name the viewer's side and mirror each other", () => {
  const left = viewInstruction("left45");
  const right = viewInstruction("right45");
  assert.notEqual(left, right);
  assert.match(left, /viewer's LEFT/);
  assert.match(left, /nose points toward the left edge/);
  assert.match(left, /RIGHT side of the face/);
  assert.match(left, /left ear is hidden/);
  assert.match(right, /viewer's RIGHT/);
  assert.match(right, /nose points toward the right edge/);
  assert.match(right, /LEFT side of the face/);
  assert.match(right, /right ear is hidden/);
  for (const text of [left, right]) assert.match(text, /must clearly not be a frontal view/);
  assert.match(viewInstruction("front"), /facing the camera directly/);
  assert.doesNotMatch(viewInstruction("front"), /not be a frontal view/);
});

test("every stage after the draft names what it must keep, or the edit model drops it", () => {
  const { options } = fixture();
  const edit = editInstruction({ gender: genderId(2), age: ageId(1) }, { gender: genderId(2), age: ageId(1), hair: "hair" }, options);
  const view = viewInstruction("left45");
  const look = lookInstruction({ outfit: "a navy suit" });
  // "the same person" alone let the model re-do makeup, lighten the skin and age the face.
  for (const instruction of [edit, view, look]) {
    assert.match(instruction, /the same face and identity/);
    assert.match(instruction, /the same apparent age/);
    assert.match(instruction, /the same complexion depth and skin tone/);
    assert.match(instruction, /the same makeup at the same strength/);
    assert.match(instruction, /do not add makeup or make it stronger/);
    assert.match(instruction, /do not lighten or warm the skin/);
    assert.match(instruction, /do not age the face/);
  }
  // Each stage still does its own job on top of that.
  assert.match(edit, /change the hairstyle to/);
  assert.match(view, /45 degrees toward the viewer's LEFT/);
  // The three views are a reference sheet for the acting video, so a plain background is correct there.
  assert.match(view, /plain neutral background/);
  assert.doesNotMatch(look, /plain neutral background/);
  assert.match(look, /full body visible from head to shoes/);
});

// ---------------------------------------------------------------- 09-29

test("hair is directed toward a natural matte sheen, never gloss, at every stage", () => {
  const { traits, options } = fixture(0, genderId(1));
  const request = parse(draftPrompt(tones[0], traits, options));
  assert.doesNotMatch(request.subject.presentation, /healthy and glossy/);
  assert.match(request.subject.presentation, /never a glossy or lacquered shine/);
  assert.match(request.subject.presentation, /matte-leaning rather than shiny/);
  assert.match(request.camera_technical.retouching, /matte-leaning rather than fused/);
  assert.match(request.avoid.join(" "), /glossy lacquered mass/);
  // Later stages must not put the gloss back.
  assert.match(viewInstruction("front"), /do not add gloss to the hair/);
  assert.match(editInstruction(traits, { ...traits, hair: "color" }, new Map([...options, ["color", { id: "color", kind: "hair", prompt: "a bob" }]])), /matte-leaning hair texture/);
});

test("a selected face type defines the face; candidates differ by how strongly it reads", () => {
  const { traits, options } = fixture(0, genderId(1));
  const withFace = new Map([...options, ["face", { id: "face", kind: "face", prompt: "a \"cat-like\" face: almond eyes" }]]);
  const faces = [0, 1, 2, 3].map((i) => parse(draftPrompt(tones[0], { ...traits, face: "face" }, withFace, i)).subject.identity_fixed.face);
  for (const face of faces) assert.ok(face.startsWith("a \"cat-like\" face: almond eyes; "), face);
  assert.equal(new Set(faces).size, 4);
  assert.match(parse(draftPrompt(tones[0], { ...traits, face: "face" }, withFace)).subject.identity_fixed.priority, /face type/);
  // Without a face type the contour variations are unchanged.
  assert.equal(parse(draftPrompt(tones[0], traits, options, 2)).subject.identity_fixed.face, "a softly rounded face and balanced facial proportions");
});

test("slider adjustments become relative instructions and nothing else is touched", () => {
  const { traits, options } = fixture();
  assert.equal(editInstruction(traits, traits, options, { eye_tilt: 50 }, { eye_tilt: 50 }), null);
  // A nudge inside the dead zone is not a change, so it cannot cost a credit.
  assert.equal(editInstruction(traits, traits, options, {}, { eye_tilt: 6 }), null);
  const text = editInstruction(traits, traits, options, { eye_tilt: 40, brow_height: 60 }, { eye_tilt: 70, brow_height: 0, hair_color_depth: -100 });
  assert.match(text, /tilt the outer corners of the eyes slightly upward/);
  assert.match(text, /set the eyebrows clearly lower/);
  assert.match(text, /hair color strongly lighter and softer, keeping the same hue/);
  assert.match(text, /leave every other part of the face exactly as it is/);
  assert.match(text, /keep the same person/);
  assert.doesNotMatch(text, /change the hairstyle/);
  assert.deepEqual(asAdjustments({ eye_tilt: 2, nose_height: 0, brow_tilt: 500, eye_height: 1.5, junk: 1 }), { eye_tilt: 2 });
  // Makeup only goes lighter. The current look is the ceiling, in line with the identity lock.
  assert.deepEqual(asAdjustments({ makeup_lip: 40, makeup_blush: 10 }), {});
  assert.match(editInstruction(traits, traits, options, {}, { makeup_blush: -70, makeup_lip: -20 }), /lip colour slightly sheerer[^.]*, reduce the blush on the cheeks strongly/);
  // The brow toggle is a switch: any truthy value is stored as 100 and phrased without a degree.
  assert.deepEqual(asAdjustments({ brow_match_hair: 1 }), { brow_match_hair: 100 });
  assert.match(editInstruction(traits, traits, options, {}, { brow_match_hair: 100, brow_depth: -50 }), /eyebrows clearly lighter and softer[^.]*, match the eyebrow colour to the hair colour/);
  assert.match(editInstruction(traits, traits, options, {}, { eye_scale_x: 60, eye_scale_y: -30 }), /eyes clearly wider horizontally, make the eyes slightly shorter vertically/);
  assert.match(editInstruction(traits, traits, options, {}, { brow_thickness: 40 }), /eyebrows clearly thicker and fuller/);
  // A makeup chip is a refinable trait and its phrase comes before the identity lock so it wins.
  const withMakeup = new Map([...options, ["mk", { id: "mk", kind: "makeup", prompt: "no makeup at all" }]]);
  const mk = editInstruction(traits, { ...traits, makeup: "mk" }, withMakeup);
  assert.match(mk, /^change the makeup to no makeup at all — this replaces the current makeup/);
  const drafted = parse(draftPrompt(tones[0], { ...traits, makeup: "mk" }, withMakeup));
  assert.equal(drafted.subject.styling.makeup, "no makeup at all");
  assert.match(drafted.subject.presentation, /follow styling.makeup exactly/);
  assert.match(drafted.subject.identity_fixed.priority, /makeup/);
  assert.match(editInstruction(traits, traits, options, {}, { jaw_vline: 50, chin_length: -30 }), /jawline clearly slimmer[^.]*V-line, make the chin slightly shorter/);
  assert.match(editInstruction(traits, traits, options, {}, { nose_width: 80, midface: -40 }), /nose wings strongly narrower, make the midface clearly shorter[^.]*keeping the eyes and mouth themselves unchanged/);
  // Chips and sliders share one instruction, so one apply is one credit.
  const both = editInstruction(traits, { ...traits, vibe: "vibe2" }, new Map([...options, ["vibe2", { id: "vibe2", kind: "vibe", prompt: "a warm look" }]]), {}, { nose_tilt: 20 });
  assert.match(both, /change the expression to a warm look, turn the nose tip slightly upward/);
});

test("the three views carry the video reference direction, since the video model takes no prompt", () => {
  for (const angle of ["front", "left45", "right45"]) {
    const text = viewInstruction(angle);
    assert.match(text, /motion reference/);
    assert.match(text, /immutable traits/);
    assert.match(text, /gaze steady into the lens/);
    assert.match(text, /relaxed forehead, soft jaw/);
    assert.match(text, /clear catchlight/);
  }
});

