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
| `Exercise` | `domain/exercise.ts` | One movement, including the full instruction experience: starting position (seven named body parts), numbered steps, breathing, tempo, what you should feel, mistakes, cues, structured safety, and a demo spec |
| `Pose` | `domain/pose.ts` | Eight joints plus an optional spine curve, in a 100x100 box with the floor at y=88 |
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

### The instruction experience

`Exercise` carries ten sections, each its own field rather than prose:
`startingPosition` (hands, feet, body, spine, head, shoulders, hips), `steps`,
`breathing` (inhale and exhale stated separately), optional `tempo` as named
phases, `sensation` (what works, what else is normal, what means stop),
`commonMistakes`, `cues`, `safety` (normal effort, normal fatigue, concerning
pain, stop if, modify if), and the regression and progression links.

Structure rather than prose is what lets `content/completeness.test.ts` audit
the library field by field, including that no pain word ever appears in a list
of normal sensations.

### Drawings

Exercises do not carry drawings. They reference named poses from
`content/poses.ts`, and one renderer draws any pose, so a push-up top and a
plank hold are literally the same figure.

A pose is authored as approximate joint positions, but the builder keeps only
each segment's *direction* and rebuilds it at a fixed length, then scales and
translates the result into frame. Hand-typed coordinates drift; this makes that
impossible. `content/poses.test.ts` checks the result is a plausible human in
every pose and that limb lengths stay consistent from pose to pose.

The captions are always on screen. The drawing supports the written
instructions and never replaces them.

### The program

`content/program.ts` holds four authored `Workout` records, one per training
day. It is fixed content, not generated: nothing adapts, and the progression
engine is a later sprint.

`domain/duration.ts` computes how long a workout takes from its tempo, targets
and rest, so "20 to 30 minutes" is checked rather than asserted. The estimate is
deliberately slightly high — rest is charged after the final set too, because in
practice that time is spent walking to the next exercise.

`content/program.test.ts` enforces the programming rules: never more than two
training days in a row, a different focus each day, no pressing on consecutive
days, nothing needing equipment the athlete lacks, and every prescribed exercise
carrying its full Sprint 3 instructions.

### Performing a workout

`domain/session-log.ts` holds the whole of it as pure functions over a
`WorkoutSession`: `startSession`, `recordSet`, `finishSession`, `sessionSummary`
and `compareToPrevious`. The player component owns only phase and timers.

The five difficulty words the athlete is offered map onto RPE, so history is
stored on a numeric scale and read back as words. A session is `completed` when
every prescribed set was done, `partial` when some were, and `missed` when none
were — and a missed session drops its logged sets, because the schema is right
to refuse work nobody performed.

The player writes after **every set**, not on finish, so a closed tab costs at
most the set in progress. Session ids are `date-workoutId`, so reopening the
same workout on the same day resumes the same record.

Nothing in here changes a target or advances a variation. That is the
progression engine, which does not exist yet.

### Progression

`domain/progression-engine.ts` decides what to prescribe next. Three rules, and
only ever **one** change per decision:

1. Clear every set at the top of the range, twice running, without it feeling
   maximal → make it slightly harder. Reps first. Only when reps hit their
   ceiling does a set get added; only when sets are capped too does the
   variation change.
2. Struggle, or fall short once → change nothing. Repeating a session is a
   legitimate outcome.
3. Fall short twice running → give something back, in reverse order: the target
   returns to the exercise's own base range in one step, not one rep at a time,
   and only at the base does the variation step back.

Only main work progresses. Warm-ups and mobility are there to prepare the body,
and a cat-cow that keeps gaining reps helps nobody. Accessory volume in a family
progresses its reps but may not change variation — only the exercise the family
state sits on can do that.

Every decision carries a `reason` written to the athlete, which the completion
screen shows under "Next time".

**What it cannot see.** The app records reps, seconds, whether a set was
completed, and how hard it felt. It cannot observe technique, range of motion or
tempo, so "good technique" is a proxy: sets finished below a very-hard effort.
Rest and tempo are deliberately held constant — cutting rest makes a session
harder without making the athlete stronger, and moving tempo alongside reps
would confound both.

### Pathways

Families group under a `pathway` — push, legs, core, pull, skill, mobility —
described in `content/families.ts` alongside `PATHWAY_INFO`. A pathway is a
group of ladders, not one chain: Core holds three, because resisting extension,
resisting sideways collapse and flexing under a hang are different qualities,
and merging them would mean abandoning the front plank the day you start side
planks. The UI says so rather than leaving it to be inferred.

`features/pathways/PathwaysScreen.tsx` draws the whole map: every ladder as a
vertical list of steps marked cleared / current / ahead / locked, each step a
link into its instructions.

Two pathways carry a note of their own. **Pull** states that meaningful vertical
pulling needs something safe to hang from, names the improvisations that fail
under load, and says the whole ladder unlocks at once when a real bar exists.
**Skill** states that the handstand is deliberately absent from the programme.

### The dashboard

`features/dashboard/DashboardScreen.tsx` is the first screen and has one job:
answer "what do I do today" before anything else is read. The session name is
the `h1`, and START WORKOUT is the only primary action on the page.

Everything below is context — weekly progress, streak, total, phase, what is
next, the last three sessions, mobility — and `domain/stats.ts` computes all of
it. Nothing there is analysis. If a number does not change what the athlete
does next, it does not belong on this screen.

The streak counts consecutive *scheduled* training days, so a rest day never
breaks it, and today is forgiven until the day is over: a streak that dies at
breakfast discourages rather than motivates.

### The calendar

`domain/history.ts` builds the training calendar, and its one structural
decision is that **a missed day is derived, never stored**. If the app is not
opened on a Monday there is no record of that Monday at all, so `historyWeeks`
works it out from the schedule instead: a training day in the past with nothing
completed on it was missed. Nothing is written back and nothing is moved, which
is what makes the athlete's rule — mark it missed, do not reschedule, continue
normally — hold by construction rather than by remembering to enforce it.

`dayFor` resolves each date in one pass, in this order:

1. a completed or partial training session → `completed` / `partial`
2. otherwise a scheduled day already past → `missed`
3. otherwise a scheduled day → `planned` (today is still `planned`; the day is
   not over)
4. otherwise → `rest`

`mobilityCount` is counted separately at every step and never fills in for a
missed workout, for the same reason mobility is counted separately everywhere
else.

Weeks, not a month grid: a month boundary means nothing to a training
programme, and "3 of 4 this week" is the number that says how the week is
going. `features/history/HistoryScreen.tsx` renders each week as seven rows
rather than seven squares, because the name of the workout is the part worth
reading and a seven-across grid has no room for it.

`features/history/SessionDetail.tsx` reads one session back — duration,
exercises, every set with its reps or seconds and the difficulty word, notes —
grouped by block. It is history only: nothing on that screen changes the
program, because the progression engine has already had its say.

### Mobility

`content/routines.ts` holds six optional restorative routines: one per mobility
area plus a combined reset. They are `Workout` records like any other, so they
play through the same player, but two fields separate them:

- `kind: 'mobility'` — the progression engine returns early on them, and
  `mobilitySessionsInLastWeek` counts them on their own. Mixing mobility into
  the training count would let a good week of stretching disguise a missed
  workout.
- `day: null` — offered, never scheduled. A rest day that feels like a missed
  workout is a rest day that stops happening.

The schema enforces both directions: a training workout must have a day and a
warm-up; a routine must have neither. Routines run 5 to 9 minutes, mostly a
single set of each position, and a test asserts the longest is less than half
the shortest training session.

`rangeOfMotion` is its own field on every exercise rather than a line buried in
step four, because "how far do I go" is the question people actually get wrong.

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

Version 2 added `kind` to workouts and sessions; its migration stamps anything
already stored as `training`, since it predates the idea of mobility sessions.
`app/migration-flow.test.tsx` boots the real app against a version 1 store to
prove an existing athlete's history survives the upgrade.

Reserved key namespaces: `meta:`, `profile:`, `workout:`, `session:`,
`progression:`.

## Startup

`app/bootstrap.ts` migrates the store, then seeds anything missing. Seeding never
overwrites, so running it on every launch is safe once the athlete has edited a
profile or logged sessions.

## Where later sprints attach

| Capability | Attaches to |
|---|---|
| Progression engine | Built: `domain/progression-engine.ts`, run from the player's `onFinish` |
| Workout player | Built: `features/player/`. Reads a `Workout`, writes a `WorkoutSession` after every set |
| Progress tracking and calendar | Built: `domain/history.ts` + `features/history/`. Reads `repositories.sessions.list()` and derives missed days from the schedule |
| Exercise demonstrations | Already built: `features/demo/FigureDemo.tsx`. `videoUrl` is left empty on every exercise because external links could not be verified from the build environment |
| Anything that prescribes work | Must filter through `isExerciseAvailable` so it never programs an exercise the athlete has no equipment for |
| Reminders | Reads `profile.trainingDays` and `profile.preferredTrainingTime` |

## Commands

```
npm run dev        development server
npm run check      typecheck + lint + tests + production build
npm test           tests only
```
