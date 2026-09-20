# Calisthenics Coach — Sprint 1 Design

**Date:** 2026-09-20
**Status:** Approved
**Scope:** Sprint 1 only — application foundation and exercise library.

## 1. Product context

A personal, single-user home calisthenics coach. The core loop the finished
product must serve:

> "What do I need to do today?" → "How do I perform it correctly?" →
> "How did I perform?" → "What should I do next?"

Sprint 1 builds the second question's answer, plus the foundation the rest
stands on.

### User profile (drives all content decisions)

| Fact | Value |
|---|---|
| Goals | Build muscle; get stronger; improve mobility and flexibility |
| Level | Complete beginner |
| Push-ups | 10 clean reps |
| Bodyweight squats | 12 clean reps |
| Pull-ups | 7 clean reps |
| Dips | 0 |
| Plank | Untested |
| Handstand | Cannot do one |
| Equipment | No purchased equipment. `availableEquipment` = `['none', 'floor', 'wall', 'chair', 'towel', 'pullup-bar', 'parallel-bars']`, where `pullup-bar` is a **fixed or outdoor bar** with full overhead clearance and `parallel-bars` is assumed present at the same location (see risks) |
| Schedule | 4 days/week, 20–30 min/session, moderate progression |
| Missed workout policy | Mark missed, never reschedule, continue normally |
| Injuries | None |

### Sprint roadmap (agreed)

| Sprint | Contents |
|---|---|
| **1** | App shell, PWA, storage layer, **exercise library** |
| 2 | Program engine + schedule + calendar + missed-workout marking |
| 3 | Workout player (sets, reps, rest timers, per-set logging) |
| 4 | Progress tracking + progressive overload + adaptive workouts |
| 5 | Dashboard + streaks + reminders |
| 6 | Mobility/flexibility track + long-term skill progression |

Sprints 2–6 are out of scope for this document. They are listed only so the
Sprint 1 interfaces are shaped to receive them.

## 2. Platform and stack

- **Vite + React + TypeScript**, installable **PWA** via `vite-plugin-pwa`.
- **Local-first.** No backend, no accounts, no network dependency. All user
  data lives on-device in IndexedDB.
- Mobile-first layout; usable on a desktop browser too.
- Styling: plain CSS with design tokens as CSS custom properties. No CSS
  framework — the app is small and the visual language is specific.
- Testing: Vitest + React Testing Library + jsdom, `fake-indexeddb` for the
  storage contract tests.

## 3. Architecture

Four layers with strict one-way dependencies:

```
src/domain/     Types + Zod schemas. No React, no I/O, no imports from siblings.
src/content/    The exercise library: one module per exercise, SVG demo
                components, ladder registry.
src/storage/    StorageAdapter interface, IndexedDbAdapter, MemoryAdapter,
                schema versioning + migration runner.
src/features/   Feature-scoped screens and components (exercise-library).
src/app/        Shell, routing, tab navigation, theme tokens, PWA registration.
```

**Dependency rule:** `app` → `features` → (`domain`, `storage`, `content`);
`content` → `domain`; `storage` → `domain`; `domain` → nothing.

This is enforced by an ESLint `no-restricted-imports` rule, not by convention
alone.

## 4. Domain model

### 4.1 Enumerations

```ts
type ExerciseId = string;   // branded kebab-case slug
type LadderId   = string;   // branded kebab-case slug
type Goal       = 'build-muscle' | 'get-stronger' | 'mobility-flexibility';

type Category   = 'push' | 'pull' | 'legs' | 'core' | 'skill' | 'mobility';
type Equipment  = 'none' | 'floor' | 'wall' | 'chair' | 'towel'
                | 'pullup-bar' | 'parallel-bars';
type Measurement = 'reps' | 'time' | 'reps-per-side' | 'time-per-side';
type Difficulty = 1 | 2 | 3 | 4 | 5;
type MuscleGroup = 'chest' | 'front-delts' | 'side-delts' | 'rear-delts'
                | 'triceps' | 'biceps' | 'forearms' | 'lats' | 'traps'
                | 'rhomboids' | 'lower-back' | 'abs' | 'obliques'
                | 'hip-flexors' | 'glutes' | 'quads' | 'hamstrings'
                | 'adductors' | 'calves' | 'wrists' | 'thoracic-spine';
```

### 4.2 Exercise

```ts
interface Exercise {
  id: ExerciseId;                 // kebab-case slug, stable forever
  name: string;
  category: Category;
  primaryMuscles: MuscleGroup[];  // >= 1
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];         // >= 1
  difficulty: Difficulty;
  measurement: Measurement;
  summary: string;                // one line, shown on the card
  setup: string[];                // how to get into the start position
  execution: string[];            // numbered movement steps
  breathing: string;
  cues: string[];                 // short coaching cues
  commonMistakes: { mistake: string; fix: string }[];
  safetyNotes?: string[];
  demo: DemoSpec;
  tags: string[];
}
```

`Exercise` carries **no** `easier`/`harder` fields. Adjacency is derived from
the ladder registry so the two directions cannot disagree.

### 4.3 Ladder registry

```ts
interface Ladder {
  id: LadderId;
  name: string;
  category: Category;
  goal: string;                   // what mastering the top step means
  steps: ExerciseId[];            // ordered easiest -> hardest
}
```

Derived accessors live in `src/domain/ladders.ts`:

```ts
function ladderOf(id: ExerciseId): Ladder | undefined;
function stepIndexOf(id: ExerciseId): number | undefined;
function easierThan(id: ExerciseId): ExerciseId | undefined;
function harderThan(id: ExerciseId): ExerciseId | undefined;
```

Sprint 4's progressive-overload engine consumes exactly this interface.

### 4.4 User profile

```ts
interface UserProfile {
  goals: Goal[];
  trainingDaysPerWeek: number;
  sessionMinutes: { min: number; max: number };
  progressionRate: 'conservative' | 'moderate' | 'aggressive';
  availableEquipment: Equipment[];
  injuries: string[];
  baselines: Record<ExerciseId, Baseline>;   // measured starting points
}

interface Baseline {
  measurement: Measurement;
  value: number | null;   // null = untested
  recordedAt: string;     // ISO date
}
```

Seeded on first run from the profile in section 1. Read-only in Sprint 1;
editable in Sprint 2.

## 5. Exercise library content

Nine progression ladders, 37 exercises. Every exercise belongs to exactly one
ladder.

| Ladder | Category | Steps (easiest → hardest) |
|---|---|---|
| `push` | push | wall-push-up → incline-push-up → push-up → diamond-push-up → archer-push-up |
| `dip` | push | bench-dip-bent-knee → bench-dip-straight-leg → parallel-bar-dip-negative → parallel-bar-dip |
| `pull` | pull | dead-hang → scapular-pull → australian-row → negative-pull-up → chin-up → pull-up |
| `squat` | legs | bodyweight-squat → split-squat → bulgarian-split-squat → assisted-pistol-squat → pistol-squat |
| `core` | core | front-plank → hollow-body-hold → hanging-knee-raise → hanging-leg-raise |
| `handstand` | skill | plank-to-pike-hold → handstand-back-to-wall → handstand-chest-to-wall → wall-handstand-shoulder-tap |
| `shoulder-mobility` | mobility | wall-angel → towel-shoulder-dislocate → bar-hang-shoulder-opener |
| `hip-mobility` | mobility | ninety-ninety-hip-switch → deep-squat-hold → cossack-squat |
| `spine-hamstring-mobility` | mobility | cat-cow → worlds-greatest-stretch → seated-pike-fold |

Each ladder spans from at or below the user's current ability to roughly
6–12 months ahead, so Sprint 4 has somewhere to progress toward.

Current standing on each ladder, for reference: push step 3 of 5, dip untested
at step 1 of 4, pull step 6 of 6, squat step 1 of 5, core untested, handstand
step 1 of 4.

Authoring rules for every exercise:

- `execution` steps are imperative and one action each.
- `commonMistakes` always pairs a mistake with its fix — never a bare warning.
- `safetyNotes` are present on every hanging, inverted, or loaded-wrist movement.
- No exercise may require equipment outside `availableEquipment`.

## 6. Demonstrations

```ts
interface DemoSpec {
  keyframes: { id: string; label: string }[];  // >= 2, e.g. Start / Bottom / Top
  loop: 'cycle' | 'ping-pong';
  videoUrl?: string;                           // optional, external, online-only
}
```

- Each exercise has a hand-authored React SVG component registered by exercise
  id in `src/content/demos/registry.ts`.
- All figures share one 200×200 viewBox and a small primitive helper module
  (`head`, `torso`, `limb`, `ground`, `bar`) so the whole set reads as one
  visual system.
- `<FigureDemo>` renders the registered component, animates between keyframes,
  and offers play/pause plus a keyframe scrubber with visible labels.
- `prefers-reduced-motion: reduce` → static keyframes laid out side by side
  with their labels. No animation, no autoplay.
- `videoUrl`, when present, renders as a clearly-marked external link. It is
  never embedded and never required.

## 7. Storage

```ts
interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys(prefix?: string): Promise<string[]>;
}
```

- `IndexedDbAdapter` — one object store, keyed by string.
- `MemoryAdapter` — same contract, used in tests.
- A `meta:schemaVersion` record plus a migration runner. Version 1 registers a
  no-op migration; the runner exists so Sprints 2–6 can evolve stored shapes
  without destroying logged history.
- Key namespacing: `profile:current`, `meta:*`, and reserved prefixes
  `session:*`, `schedule:*`, `log:*` for later sprints.

Sprint 1's only writer is the seeded user profile. This is deliberate: it
exercises the entire persistence path — seed, read, migrate, version — while
the cost of getting it wrong is still near zero.

## 8. Screens

### `/library` — Exercise library
Search by name/tag. Filters for category, difficulty, and equipment. Results
grouped by category, each card showing name, mini static figure, difficulty
indicator, and equipment badges. Empty-state copy when filters match nothing.

### `/library/:id` — Exercise detail
Animated `<FigureDemo>`; summary; muscles worked; equipment; setup; numbered
execution; breathing; cues; common mistakes with fixes; safety notes; and a
**ladder strip** placing the movement among its neighbours with tap-through to
the easier and harder steps.

### `/` — Today (placeholder)
States plainly that today's workout arrives in Sprint 2, shows the seeded
baseline stats read from storage, and links into the library. No fabricated
workout data.

### Shell
Bottom tab bar with Today and Library, sized and structured for the tabs
Sprints 2–6 will add.

## 9. PWA

`vite-plugin-pwa` in `autoUpdate` mode. Manifest with name, icons, `standalone`
display, portrait orientation, and theme colour. All application assets and
exercise content are precached — the library must work with no network.
Push notifications are explicitly deferred to Sprint 5.

## 10. Testing

`npm run check` = typecheck + lint + test + build. A sprint is not done until
it passes.

**Content integrity suite** (`src/content/content.test.ts`):
- every exercise validates against the `Exercise` Zod schema
- exercise ids are unique and kebab-case
- every ladder step id resolves to a real exercise
- every exercise belongs to exactly one ladder
- every exercise id has a registered demo component
- every `DemoSpec` has at least two keyframes
- no exercise requires equipment outside the profile's `availableEquipment`
- difficulty is non-decreasing along each ladder

**Storage contract suite** (`src/storage/adapter.contract.test.ts`):
- one shared contract test run against both `MemoryAdapter` and
  `IndexedDbAdapter` (via `fake-indexeddb`)
- migration runner leaves v1 data intact and records the schema version

**Component tests:**
- library filters and search narrow results correctly
- detail page renders execution steps, cues, and mistakes
- ladder strip navigates to the correct neighbours
- `FigureDemo` falls back to static frames under reduced motion
- first-run seeding writes the profile exactly once and is idempotent

## 11. Explicitly out of scope for Sprint 1

Workout generation, the schedule, the calendar, the workout player, rest
timers, logging, progression calculation, adaptive workouts, streaks, and
notifications. The Today screen is a labelled placeholder, not a stub
pretending to work.

## 12. Known risks

- **SVG authoring volume.** 37 figures is the bulk of the sprint's effort. The
  shared primitive module is the mitigation; if figures start diverging in
  style, that is the signal to stop and tighten the primitives.
- **Pull ladder has no headroom.** The user is already at the top step. Sprint 4
  will need harder pull variations (archer, weighted, one-arm progressions)
  added. Noted here so it is not discovered late.
- **Plank and dips are untested.** Baselines are `null`. Sprint 2's generator
  must handle untested baselines rather than assuming a number.
- **`parallel-bars` is an unconfirmed assumption.** The top two steps of the dip
  ladder need them. Outdoor bar setups usually have them, but this was never
  confirmed. The mitigation is already in the design: `parallel-bars` is its own
  equipment flag, so the library's equipment filter can exclude those two steps,
  and the bench-dip steps below them need only a chair. Confirm before Sprint 2
  programs dips.
