# Guided Idiom Study Flow Spec

## Purpose

Improve the lesson study experience for idioms by keeping the current reference-style reading flow, then adding optional controls that let the learner turn the same page into an active recall flow.

The learner's current method is valuable:

1. First review idiom titles without examples.
2. Then read the English examples without Persian translation.
3. After each example, reveal and study the Persian translation.

This spec keeps that learning sequence, but does not force it by default. The page should still show the idiom information normally, just like the current app. The learner can hide examples or hide Persian example translations when they want to study actively.

The goal is not only to "read" each idiom. The goal is to let the learner choose between quick reference and active recall without leaving the lesson page.

## Product Area

Primary area:

```text
src/app/book/book-client.tsx
```

Supporting areas:

```text
src/lib/storage.ts
src/lib/idioms.ts
src/types/types.ts
src/app/cards/cards-client.tsx
```

The route can stay as:

```text
/book
```

Visible UI wording should prefer "Lessons", "Study", or "Lesson Study" instead of relying on book metaphors.

Important project constraint:

- Do not use book photos, book illustrations, book covers, or book imagery.
- Prefer visual metaphors like cards, conversation, practice, notes, progress, language, recall, or lesson paths.

## Confirmed Product Decision

The default lesson experience must stay information-first, like the current `Book Study` page.

Default behavior:

- Show idiom phrase.
- Show Persian idiom meaning.
- Show English and Persian definitions when available.
- Show usage notes when available.
- Show examples.
- Show Persian example translations.

New behavior:

- Add controls so the learner can hide examples.
- Add controls so the learner can hide only Persian translations inside examples.
- Let the learner reveal hidden content again without changing pages.

This means the app should not force hidden answers by default.

## Core Idea

Add "Study Focus" controls to the existing lesson detail view.

The learner can keep the current full-information view, or activate a focused study setup:

1. Hide examples to review idioms without example help.
2. Show examples but hide Persian translations.
3. Read each English example.
4. Reveal the Persian translation for one example at a time.
5. Mark the idiom as "Got it", "Still learning", or "Needs review".
6. Optionally write one personal example sentence.

This turns the lesson page into both a reference page and a study page.

## Study Flow

### Step 1: Default Lesson View

Show the selected lesson and selected idiom with the same information that the app shows now.

Visible by default:

- English idiom phrase
- Persian idiom meaning
- English definition
- Persian definition
- English explanation
- Persian explanation
- Examples
- Persian example translations

Do not hide this information automatically on first load.

Reason:

- The app should stay useful as a fast reference tool.
- The learner should decide when to switch into active study.

### Step 2: Study Focus Controls

Add a compact control group near the examples area or near the top of the idiom detail panel.

Required controls:

- "Show examples" / "Hide examples"
- "Show Persian translations" / "Hide Persian translations"

Optional controls:

- "Show all"
- "Hide translations"
- "Reset view"

Behavior:

- Hiding examples hides the whole examples section.
- Hiding Persian translations keeps English examples visible and hides only `example.persian_meaning`.
- Showing Persian translations reveals all example translations again.
- These controls should not hide the idiom's main Persian meaning unless a separate future control is added for that.

### Step 3: Example Translation Reveal

When Persian example translations are hidden, each example card should still show the English example.

Each example card should have:

- English example visible.
- Persian translation hidden.
- A reveal button for that example only.
- A hide button after the translation is visible.

Controls per example:

- Eye icon button: reveal Persian translation.
- Eye-off icon button: hide Persian translation again.

Important behavior:

- Revealing the translation for one example must not reveal every example.
- The learner should be able to hide the translation again.
- The UI should make it obvious which examples are currently hidden or revealed.

### Step 4: Optional Recall Check

After studying an idiom, ask the learner for a quick self-check.

Show three action buttons:

- "Got it"
- "Still learning"
- "Needs review"

Behavior:

- "Got it" marks the idiom as known.
- "Still learning" marks it as studied but not known.
- "Needs review" adds it to the review deck.

Current storage already supports:

```ts
StudyProgress = {
  studied: Record<string, string>;
  known: Record<string, string>;
  review: Record<string, string>;
};
```

Use those existing fields before adding new ones.

Suggested mapping:

- Got it: set `studied` and `known`, remove from `review`.
- Still learning: set `studied`, remove from `known`, do not require `review`.
- Needs review: set `studied` and `review`, remove from `known`.

### Step 5: Personal Example

Optional but recommended:

Add a small "My sentence" area after the recall check.

The learner can write one personal sentence using the idiom.

Controls:

- Textarea
- Save button
- Clear button

Storage:

Add a local storage key later if needed:

```text
idioms:v1:personal-examples
```

Possible shape:

```ts
type PersonalExamples = Record<
  string,
  {
    text: string;
    updatedAt: string;
  }
>;
```

This is lower priority than hide/show controls and review statuses.

## Earlier Guided Study Idea

The earlier version of this spec suggested a separate `Guided Study` mode where Persian content was hidden by default.

That is no longer the primary requirement.

The preferred implementation is:

- Keep the current full-information view as default.
- Add hide/show controls inside the existing view.
- Add recall status buttons when useful.

A stricter guided mode can still be added later, but it should not replace the default experience.

## Lesson List Behavior

The idiom list should continue to work as it does now unless the implementation adds a broader "focus mode" later.

Default row content:

- Lesson number
- Idiom count
- Progress for the lesson
- Each idiom phrase
- Persian idiom meaning
- Status indicator for each idiom

Statuses:

- New
- Previewed
- Learning
- Review
- Known

Desired behavior:

- The learner can browse normally.
- The learner can still search meanings.
- Hiding examples in the detail panel should not break search behavior.

## View Controls

Do not add a required study mode switch for the first implementation.

Instead, add direct controls in the selected idiom detail panel:

- Examples: `Shown` / `Hidden`
- Persian translations: `Shown` / `Hidden`

Recommended UI:

- Use compact toggle buttons or segmented controls.
- Place them near the `Examples` heading.
- Use `Eye` and `EyeOff` icons from `lucide-react`.
- Keep labels clear enough that the learner understands whether they are hiding the whole examples section or only the Persian translations.

Optional future modes:

- `Quick Review`: hide all answer-like content and show only self-rating controls.
- `Strict Guided Study`: start with examples/translations hidden.

These modes should not be part of the first implementation unless explicitly requested later.

## Detail Panel Layout

Recommended structure:

```text
Header
  Level, lesson, idiom phrase
  Save button

Study Controls
  Examples: Shown/Hidden
  Persian translations: Shown/Hidden

Examples
  Example 1 English
  Persian translation visible by default
  Hide/Reveal Persian

  Example 2 English
  Persian translation visible by default
  Hide/Reveal Persian

Meaning And Notes
  Visible by default

Recall Check
  Got it | Still learning | Needs review

Personal Example
  Optional textarea
```

The layout should stay calm and dense enough for repeated study. Avoid a landing-page feel inside the study tool.

## State Model

Add local component state for examples visibility:

```ts
type StudyFocusState = {
  examplesVisible: boolean;
  translationsVisibleByDefault: boolean;
  revealedTranslations: Record<string, boolean>;
};
```

Default state:

```ts
const defaultStudyFocusState: StudyFocusState = {
  examplesVisible: true,
  translationsVisibleByDefault: true,
  revealedTranslations: {},
};
```

Visibility logic:

```ts
const isTranslationVisible =
  focus.translationsVisibleByDefault || Boolean(focus.revealedTranslations[exampleKey]);
```

Reset local per-example reveal state when:

- Selected idiom changes.
- Active lesson changes.
- Active level changes.
- Search query changes enough to change selected idiom.

Do not reset saved progress when visibility state resets.

Open decision:

- Decide whether the main toggles should reset for each idiom or persist while moving through the lesson.

## Optional Persisted Study Metadata

The first implementation can use only existing progress storage.

If richer tracking is desired, add:

```text
idioms:v1:study-events
```

Possible type:

```ts
type StudyEvents = Record<
  string,
  {
    previewedAt?: string;
    examplesRevealedAt?: string;
    recallCheckedAt?: string;
    translationsHiddenCount?: number;
  }
>;
```

This should be optional. Do not block the first version on analytics.

## Keyboard Shortcuts

Useful but optional:

- Space: reveal next hidden translation
- 1: Got it
- 2: Still learning
- 3: Needs review
- S: save or unsave idiom

If shortcuts are added, provide proper button labels and accessible names. Do not rely only on keyboard behavior.

## Accessibility

Requirements:

- Reveal buttons must be real `button` elements.
- Icon-only buttons must have `aria-label`.
- Persian text must use `dir="rtl"`.
- English text must use `dir="ltr"`.
- Mixed Persian and English content should not visually collide.
- Buttons must have visible focus states.
- Hidden content should not be read by screen readers until revealed.

## Visual Direction

Use a study-tool style:

- Clean panels
- Small status chips
- Clear icon buttons
- Stable layout
- No oversized marketing hero sections
- No nested cards inside cards

Do not use book imagery.

Recommended icon ideas from `lucide-react`:

- `Eye`
- `EyeOff`
- `CheckCircle2`
- `RotateCcw`
- `Bookmark`
- `BookmarkCheck`
- `Brain`
- `MessageCircle`
- `ListChecks`

Use icons where they make controls easier to scan.

## Implementation Plan

### Phase 1: Examples Visibility Controls

1. Keep the current default view visible.
2. Add local visibility state for examples and Persian example translations.
3. Add an examples show/hide control.
4. Add a Persian translations show/hide control.
5. Add per-example reveal/hide buttons when translations are hidden.
6. Keep existing Mark studied and Save behavior.

### Phase 2: Recall Status

1. Replace or supplement "Mark studied" with:
   - Got it
   - Still learning
   - Needs review
2. Use existing `markCard` behavior or add a small helper in `storage.ts`.
3. Show status badges in the idiom list.
4. Make "Needs review" feed the existing cards review mode.

### Phase 3: Lesson Session Polish

1. Add lesson progress markers.
2. Add "Reset view" or "Show all" controls if the UI needs them.
3. Add optional personal example textarea.
4. Add optional keyboard shortcuts.

## Acceptance Criteria

The feature is ready when:

- The book/lesson page still shows the same idiom information by default.
- Examples are visible by default.
- Persian example translations are visible by default.
- The learner can hide the whole examples section for the selected idiom.
- The learner can hide Persian translations while keeping English examples visible.
- Each English example can reveal its Persian translation independently.
- The learner can hide a revealed Persian translation again.
- The learner can mark an idiom as Got it, Still learning, or Needs review.
- Needs review idioms appear in the existing review deck flow.
- The current reference-style reading flow remains available without extra setup.
- Persian text uses `dir="rtl"` and remains readable beside English text.
- No book imagery is added to the UI.

## Suggested First Implementation Target

Start with the smallest useful version:

1. Keep the current lesson/detail information visible on first load.
2. Add a `Hide examples` / `Show examples` control.
3. Add a `Hide Persian translations` / `Show Persian translations` control.
4. Add independent reveal/hide buttons for each example translation.
5. Add the three recall buttons using existing progress storage.

This gives the learner the real benefit immediately without requiring a large redesign.
