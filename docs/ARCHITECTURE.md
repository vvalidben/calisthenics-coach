# Architecture

A personal, single-user calisthenics coach. Installable PWA, local-first, no
backend and no accounts. Everything the athlete does lives in IndexedDB on the
device.

## Layers

Five layers with strict one-way dependencies. `eslint.config.js` enforces this;
a violation fails `npm run lint`.

```
src/app/        Shell, routing, bootstrap, theme. May import anything below.
src/features/   Screens, grouped by feature. May import content, storage,
                notifications, domain.
src/content/    The exercise catalog and seed data. May import domain only.
src/storage/    Adapters, migrations, repositories. May import domain only.
src/notifications/  Notification delivery. May import domain only.
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

### Reminders

Three pieces, deliberately separate:

- `domain/reminders.ts` decides **when** a reminder is due and **what** it says.
  Pure functions of the profile, the program and a clock reading, so every case
  is testable at any date and time without a browser.
- `notifications/` delivers one. `BrowserNotifier` wraps the browser's own
  Notification API; `MemoryNotifier` records instead, for tests. `unsupported`
  is a state of its own, distinct from `denied`: a browser without
  notifications is not the same as an athlete who said no.
- `features/reminders/useReminders.ts` joins them, polling once a minute.

There is one clock in the system, `profile.preferredTrainingTime`, defaulting to
18:00 — late enough to be warm and fed, early enough that a hard session is not
the last thing before sleep. A reminder preference is a *lead time* off that
clock rather than a schedule of its own, so moving training moves the reminder
with it and the two cannot drift apart.

A reminder stays due for the rest of the day once its time passes, because a
late start beats none, and goes quiet the moment work is logged. It only ever
looks at today: raising yesterday's missed session the next morning would be
rescheduling it by another name, which the athlete has ruled out.

The notification is sent **only while the app is in the background**. If they
are looking at the screen, the banner *is* the reminder, and interrupting
someone who is already reading it is noise.

#### These are not push notifications

Worth being exact, because the difference matters:

| | What this app does | What push would do |
|---|---|---|
| Reaches a closed app | No | Yes |
| Needs a server | No | Yes |
| Works offline, no account | Yes | Needs a subscription endpoint |

Everything here runs inside the page. `setInterval` stops when the tab is
discarded, and browsers throttle or kill background timers aggressively, so if
the app is closed at 18:00 **nothing arrives**. The app says so in Settings
rather than letting the athlete find out by missing a week.

True push would require, at minimum:

1. **A server**, plus a VAPID key pair — the one part this project does not
   have and has deliberately not needed.
2. **A `PushManager` subscription** from the service worker, and that endpoint
   stored server-side per device.
3. **A scheduler on the server** that knows each athlete's training days,
   training time and timezone and posts an encrypted payload to the push
   service at the right moment.
4. **`self.addEventListener('push', ...)`** in the service worker calling
   `registration.showNotification`, which is the only path that works with the
   app closed.
5. **iOS**: the app must be installed to the home screen. Safari grants
   notification permission to installed PWAs only.

Steps 3 and 4 are where the athlete's data would have to leave the device,
which is the real cost. Nothing about the current architecture blocks it: the
`Notifier` interface is the seam, and a `PushNotifier` implementing the same
three methods would slot in beside `BrowserNotifier` without the domain or the
screens changing at all.

### Settings

`features/settings/SettingsScreen.tsx` edits the three things the athlete owns:
training days, training time, and reminder preferences. It saves on every
change — there is no server to round-trip to, and a settings screen that can be
left in an unsaved state is one that silently loses changes.

Two guards. The last training day cannot be removed, because a program with no
days is not a program. And a chosen day the program has no session for is
called out by name rather than quietly promising a workout that does not exist:
the program covers four particular weekdays, and the schedule is still the
athlete's to set.

`reminders` was added to the profile as a **defaulted field rather than a
migration**. A profile written before Sprint 11 simply parses with sensible
settings filled in, which is less machinery than a migration for the same
result.

### One session per workout per day

The stored session id is the date plus the workout id, so the store can hold
exactly one session per workout per day. Sprint 15's QA pass found the UI did
not respect that, in two directions:

- An **interrupted** workout was lost. The player wrote after every set, but
  reopening the workout started a *new* session at the same id and wrote over
  it. `WorkoutRoute` now loads today's `in-progress` session and hands it to
  the player as `resume`; the player picks up at the first exercise with sets
  still owed.
- A **finished** workout could be silently overwritten. Starting it again the
  same day replaced a completed session with a fresh, emptier one. The
  dashboard now shows what was done instead of offering START, and the route
  refuses to open the player at all — so the address bar cannot do it either.

The cost is that ending a session early ends it for that day. That is the
right trade against losing a record that was actually earned, and it is stated
in the README rather than left to be discovered.

### The coach agrees with the engine

The same QA pass found the coach could describe a session the engine had
already judged differently: three reps against a target of six read as "you
struggled with the final set" because the analysis only knew about the *top* of
the range. `ExerciseAnalysis` now carries `shortSets` — completed sets below
the prescribed minimum — and any of them makes the exercise `broke-down`, which
is the same line the engine draws. Two components reading the same session must
not tell the athlete two different stories about it.

### An exercise never attempted is not a failure

`progressWorkout` judged every prescribed exercise, including ones with no
logged sets at all, because `startSession` pre-populates them. Ending a session
early therefore counted as a failure for everything untouched, and two short
sessions would step those families down a level. It now skips exercises with no
sets. A *skipped* set still counts — that is a recorded outcome — but an absent
one is not.

### The interface contract

Three test files hold the parts of the interface that are easy to erode and
hard to notice: `app/theme.test.ts`, `app/document.test.ts` and
`app/accessibility.test.tsx`.

**What they can and cannot prove.** Tests run with `css: false` and jsdom has
no layout engine, so nothing here measures a rendered pixel. `theme.test.ts`
parses `theme.css` as text and asserts the *contract* it promises: every tap
target declares at least 44px of height, body text never drops below 16px, the
instruction steps are set a size up, a wide-screen layout exists, motion stays
inside a `prefers-reduced-motion` guard, and exactly one element removes its
focus outline. It cannot prove a button looks right, and does not claim to.

`theme.test.ts` also computes WCAG contrast from the palette tokens, which
*is* exact. Sprint 14 found three inks failing AA for normal text against the
lighter surfaces — `--chalk-faint` at 3.4:1 carries most of the small print —
and lifted `--chalk-faint`, `--chalk-dim`, `--done` and `--missed` until every
ink passes 4.5:1 on every surface.

`accessibility.test.tsx` walks all seven screens and asserts one `h1` each, a
`main` landmark, an accessible name on every control, a label on every field,
no positive `tabindex`, and no skipped heading level.

**Navigation.** A skip link is the first thing a keyboard reaches, and `main`
takes focus on every navigation so a screen-reader user lands on the screen
they asked for rather than back at the tab bar. `main` is the one element in
the app whose focus outline is removed: it is not tab-reachable, so nobody can
arrive there and lose their place.

**Layout.** Mobile first, one column, with the navigation as a bottom bar
because that is where a thumb reaches. Above 900px the *same markup* becomes a
left sidebar — CSS only, so every test that finds a tab keeps finding it — and
the content column keeps its measure in the middle. The bar is hidden entirely
during a workout: a fixed control under the thumb that ends the session is a
mis-tap waiting to happen, and the player has its own way out.

**The primary workflow** has its own end-to-end test, `app/workflow.test.tsx`,
which walks dashboard → start → demonstration → perform → record → rest → next
→ finish → progress and asserts each step is one obvious action. On the
dashboard and in the player it asserts there is exactly *one* element styled as
the primary action, which is what keeps "what do I do now" answerable without
reading.

**Instructions while training.** `features/player/QuickInstructions.tsx` puts
the steps, breathing, cues and the stop-conditions inside the player as a
closed-by-default disclosure. Navigating to the full instruction screen
mid-session used to be the only way to read them, and it lost the athlete's
place. The full screen is still one link away for everything the brief leaves
out.

### Training phases

Four phases — Foundation, Strength Development, Intermediate Calisthenics,
Skill Development — and **not one of them ends because time passed.** A phase
ends when the athlete has demonstrably earned the next one. `plannedWeeks` on
the profile is indicative only and is read by nothing that decides anything;
there is deliberately nowhere in a phase spec to put a duration, and
`phases.test.ts` asserts that the field list stays that way.

The split follows the same shape as everything else here. `domain/phase.ts`
knows *how* to measure five dimensions; `content/phases.ts` decides *how much*
of each a phase asks for:

| Dimension | Measured by |
|---|---|
| Consistency | Sessions inside the phase, and sessions kept against sessions scheduled over four weeks |
| Technique | The coach's proxy: the share of recent exercises finishing clean |
| Strength | Named benchmarks — `3 sets of 10 push-ups` — at the *n*th best set, so one good set cannot claim three |
| Exercise performance | How far each family has climbed its own ladder |
| Recovery | Not arriving at a harder phase already run down |

Every criterion has to be true at once, and each is shown with its own number
rather than a single percentage: "four more sessions and three more push-ups"
is something an athlete can act on this week; "62% through Foundation" is not.

Two constraints on the content, both enforced by tests:

- **Nothing may need equipment the athlete does not have.** A criterion resting
  on a pull-up bar would lock the ladder shut for good, so `parallel-bar-dip`
  and the whole pull ladder stay out of the criteria until a bar exists.
- **Nothing may rest on time**, as above.

Phases advance from `WorkoutRoute`'s `onFinish`, which is the only moment
performance changes, and the new phase starts that day. A phase begins on a
day and work done on that day counts toward it, so the session that earns a
phase is also its first — one session out of sixteen, and better than an
off-by-one that drops the first day an athlete ever trains.

`stats.ts` no longer has `phaseProgress`. It measured a phase in weeks served,
which is precisely what must not drive anything, and the dashboard now takes
the phase's name from the content and its progress from the criteria.

### The coach

`domain/coach.ts` reads a finished session back and says one sensible thing
about it. The split from the progression engine is the point: **the engine
decides what the numbers do, the coach decides what to say** — and adds the one
judgement a single session cannot support.

`analyseSession` produces, per main-work exercise: sets prescribed and
completed, failed sets, total reps or seconds, average difficulty as a word,
whether every set reached the top of the range, how far the reps fell away
first set to last, and a quality of `clean`, `strained` or `broke-down`. It
reads `SessionExercise.prescribed`, which records what was asked for at the
time, so a session from months ago prescribed differently still analyses
correctly without the workout it came from.

Two definitions worth stating, because both could reasonably go the other way:

- **A failed set** is one that was abandoned, or one rated *Failed* that also
  came up short of the target minimum. Hitting the top of the range with
  nothing left is a grind, not a failure, and the coach does not treat it as
  one.
- **A strained session** is one where half the exercises or more did not hold
  up. One hard lift in a session of four is a hard lift; calling that a hard
  session would have the coach flinching at ordinary training.

`coachReport` returns a focus of `progress`, `steady` or `recovery`, a headline
and one line of advice. Recovery is the only thing that looks beyond today, and
it needs a pattern: `needsRecovery` is true when the **last two** training
sessions were both strained.

**Recovery is advice, not a reduction.** The engine has already decided whether
the numbers move; cutting them as well would be two changes at once, which is
the thing the whole system exists to avoid. The targets stay exactly where they
are and the athlete is asked to take the next session easy.

`needsRecovery` reads the stored sessions alone, so the dashboard can ask it
**before** a workout — which is when it is actually useful. The full report
needs the engine's decisions, which only exist in memory just after a session,
so it appears on the completion screen and nowhere else.

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
| Progression engine | Built: `domain/progression-engine.ts`, run from the player's `onFinish`; `domain/coach.ts` explains its decisions |
| Workout player | Built: `features/player/`. Reads a `Workout`, writes a `WorkoutSession` after every set |
| Progress tracking and calendar | Built: `domain/history.ts` + `features/history/`. Reads `repositories.sessions.list()` and derives missed days from the schedule |
| Exercise demonstrations | Already built: `features/demo/FigureDemo.tsx`. `videoUrl` is left empty on every exercise because external links could not be verified from the build environment |
| Anything that prescribes work | Must filter through `isExerciseAvailable` so it never programs an exercise the athlete has no equipment for |
| Reminders | Built: `domain/reminders.ts` + `notifications/` + `features/reminders/`. Local only — see **These are not push notifications** |

## Commands

```
npm run dev        development server
npm run check      typecheck + lint + tests + production build
npm test           tests only
```
