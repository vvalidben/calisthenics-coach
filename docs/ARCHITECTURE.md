# Architecture

A personal, single-user calisthenics coach. Installable PWA, local-first, no
backend and no accounts. Everything the athlete does lives in IndexedDB on the
device.

## Layers

Four layers with strict one-way dependencies. `eslint.config.js` enforces this;
a violation fails `npm run lint`.

```
src/app/        Shell, routing, bootstrap, theme. May import anything below.
src/features/   Screens, grouped by feature. May import content, storage, domain.
src/content/    The exercise catalog and seed data. May import domain only.
src/storage/    Adapters, migrations, repositories. May import domain only.
src/domain/     Types, Zod schemas, pure helpers. Imports nothing.
```

`domain` is the centre. It has no React, no I/O and no knowledge of how anything
is stored or displayed, which is what lets the models be tested exhaustively and
reused by every later sprint.

Screens receive their data as props. `features` never reaches into `app` for a
context, which keeps each screen renderable in a test with nothing mocked.

## Domain models

| Model | File | Holds |
|---|---|---|
| `Exercise` | `domain/exercise.ts` | One movement: muscles, pattern, difficulty, dosing, progression links, instructions, cues, mistakes, safety, demo spec |
| `UserProfile` | `domain/profile.ts` | Goals, level, current abilities, equipment, training days and time, session length, current phase |
| `Workout` | `domain/workout.ts` | A planned day: focus, warm-up, main work, mobility, each with sets, target range and rest |
| `WorkoutSession` | `domain/session.ts` | A performed day: per-set reps or seconds, RPE, notes, status, duration |
| `ProgressionState` | `domain/progression.ts` | Per family: current variation, latest and previous performance, progression and regression criteria |

Shared vocabulary (categories, movement patterns, muscles, equipment,
measurements, weekdays, RPE, ranges) lives in `domain/primitives.ts`. Extending
the system usually means adding a member to one of those enums.

Every model is a Zod schema first and a TypeScript type second, so the same
definition validates data at the storage boundary and types it everywhere else.

### Progression links

An `Exercise` declares `regression` and `progression` by id, plus its
`progressionLevel`. Nothing computes these — they are authored. What is computed
is the check that they agree: `content/catalog.test.ts` asserts every link
resolves, links are symmetric, each family forms one unbroken chain, levels run
1..n in chain order, and difficulty never decreases up a chain.

### Families

`content/families.ts` describes each family: its name, what mastering it means,
the equipment its entry step needs, and an optional `caveat` stating a
limitation in the data rather than in a comment. The floor-pulling family uses
`caveat` to say it is not a substitute for pulling; the pull family uses it to
warn against improvising a bar.

### Availability vs. ability

Two separate ideas, deliberately not merged:

- **Ability** is a fact about the athlete, stored in `profile.currentAbilities`.
- **Availability** is a fact about their equipment, computed by
  `domain/availability.ts` from `exercise.equipment` against
  `profile.availableEquipment`.

The athlete can do 7 pull-ups and own no bar. Both are recorded; neither
overwrites the other. Bar-based content stays in the catalog in full, tested and
ready, and adding `'pullup-bar'` to `availableEquipment` is the only change
needed to unlock it. A test asserts exactly that.

## Storage

```
StorageAdapter  get / set / remove / keys / clear over namespaced string keys
  ├─ IndexedDbAdapter   the browser store
  └─ MemoryAdapter      tests, and any non-browser context
```

Both implementations pass one shared contract
(`storage/adapter.contract.test.ts`), including the guarantee that values are
stored and returned as snapshots so callers cannot mutate the store by accident.

`storage/repositories.ts` is the only thing that reads or writes domain objects.
It validates on the way in and on the way out, so data that no longer matches the
schema fails loudly at the boundary rather than surfacing as a confusing render
error.

`storage/migrations.ts` versions the stored data. Bump `CURRENT_SCHEMA_VERSION`
and add a migration whenever a stored shape changes. A failed migration leaves
the version at the last one that succeeded, so a retry resumes.

Reserved key namespaces: `meta:`, `profile:`, `workout:`, `session:`,
`progression:`.

## Startup

`app/bootstrap.ts` migrates the store, then seeds anything missing. Seeding never
overwrites, so running it on every launch is safe once the athlete has edited a
profile or logged sessions.

## Where later sprints attach

| Capability | Attaches to |
|---|---|
| Program engine and schedule | Reads `UserProfile` and the catalog, writes `Workout` records via `repositories.workouts` |
| Workout player | Reads a `Workout`, writes a `WorkoutSession` |
| Progress tracking and calendar | Reads `repositories.sessions.list()`, already ordered by date |
| Progression engine | Reads sessions, updates `ProgressionState` against its own criteria, moves along the catalog's family chains |
| Exercise demonstrations | Reads `DemoSpec.keyframes`, which is the contract a renderer fills |
| Anything that prescribes work | Must filter through `isExerciseAvailable` so it never programs an exercise the athlete has no equipment for |
| Reminders | Reads `profile.trainingDays` and `profile.preferredTrainingTime` |

## Commands

```
npm run dev        development server
npm run check      typecheck + lint + tests + production build
npm test           tests only
```
