# Calisthenics Coach

A personal home training app for one athlete: no equipment, four sessions a
week, 20–30 minutes each. It answers four questions in order — what do I do
today, how do I do it properly, how did that go, and what happens next.

It runs entirely in the browser. No account, no server, no network after the
first load. Everything is stored on the device in IndexedDB.

```
npm install
npm run dev      # development server
npm run check    # typecheck + lint + 1671 tests + production build
```

---

## 1. What it does

**Today.** The first screen names today's session, says how long it takes, and
gives you one button. On a rest day it says so and offers optional mobility. If
you have already trained today it shows what you did instead of asking again.

**The exercise library.** 64 exercises across push, dip, pull preparation,
squat, hinge, core, side core, hanging core, handstand and five mobility areas.
Every one carries the same ten sections: starting position broken into named
body parts, numbered movement steps, range of motion, breathing, tempo, what
you should feel (and what means stop), common mistakes each paired with its
fix, coaching cues, safety, and links to the easier and harder version.

**Demonstrations.** Every exercise has a hand-drawn stick-figure animation
built from a parametric pose system — no external video, no images to load.

**The workout player.** One exercise at a time: demonstration, target, rest,
coaching cue, and the full instructions without leaving the screen. After each
set it asks how many reps and how hard it felt, then runs the rest timer.

**The coach.** After every session it reads back completion, reps, difficulty,
failed sets, rep drop-off and recent history, then says in one sentence what
happens next and why.

**Progression.** Double progression, one variable at a time — reps, then sets,
then a harder variation. It backs off the same way.

**Progress.** Four long-term phases, each ended by what you can do rather than
by how long you have been in it, plus a ladder for every movement family
showing where you are and what comes next.

**History.** A week-by-week calendar of completed, partial, missed and rest
days, with mobility counted separately. Any session opens to show every set.

**Reminders.** Local notifications on training days, at a time you set.

**Settings.** Training days, training time, reminder preferences.

**Installable.** It is a PWA: install it to the home screen and it works
offline.

---

## 2. Known limitations

**These are not push notifications.** Everything runs inside the page, so a
reminder only appears while the app is open in a tab or as an installed app.
If it is closed at your training time, nothing arrives — the reminder is
waiting on the Today screen next time you open it. True push needs a server, a
VAPID key pair and a push subscription per device; `docs/ARCHITECTURE.md` lists
exactly what that would take.

**Technique is a proxy, not an observation.** The app sees reps, seconds,
whether a set was finished and how hard it felt. It cannot see a sagging hip or
a half-range squat. Wherever it says "clean", it means completed, not maximal,
and the reps did not fall away. It never claims to judge form.

**No equipment means no real vertical pulling.** Floor-based pulling work is
labelled `not-a-pull` and said to be preparation, not a substitute. The pull
ladder exists and is locked; adding `'pullup-bar'` to your equipment unlocks it.

**One session per workout per day.** The stored session id is the date plus the
workout, so once a session is finished the app will not reopen it — starting
again would write over what you logged. If you end a session early, it stays
ended for that day.

**The program is fixed at four weekdays.** You can train on any days you like,
but the app only has sessions written for Monday, Tuesday, Thursday and
Saturday. Choosing a day it has no session for is allowed and flagged by name
in Settings, and nothing is scheduled on it.

**Phases rename the work, they do not reshape it.** Entering Strength
Development changes what the app asks of you next; the four sessions themselves
still progress exercise by exercise through the engine.

**No way to edit or delete a logged session.** A mis-tapped difficulty is
history.

**Progression decisions are not stored.** The coach's full reading exists only
on the completion screen, right after a session. History can show what you did,
not what the app concluded.

**Nothing has been verified in a real browser.** The whole app was built and
tested in jsdom with 1671 automated tests plus an HTTP smoke test of the
production build. jsdom has no layout engine, so no rendered pixel has ever
been checked. A pass on a real phone is the outstanding piece of work.

**The bundle is one 188 kB gzipped chunk.** The exercise library is the bulk of
it. After first load the service worker serves everything from cache, so it is
a one-time cost, but it is not split.

---

## 3. How to use it

1. **Open it.** The first run writes your profile, the program, the mobility
   routines and your starting position in every movement family. Nothing is
   asked of you.
2. **Read Today.** It names the session and the time it takes.
3. **Look up anything you are unsure of** in Exercises before you start — or
   from inside the player, which carries the same instructions.
4. **Press Start workout.** One exercise at a time.
5. **Per set:** press *Start set*, do the reps, press *Finish set*. It offers
   the number it expects — change it if you did more or fewer — then pick Easy,
   Moderate, Hard, Very hard or Failed. Be honest; the answer drives everything.
6. **Rest** runs itself. Skip it if you are ready.
7. **At the end**, read what the coach says, add a note if you want, and press
   Done, or *See your progress*.
8. **If you miss a day, do nothing.** It is marked missed and never moved. The
   next session is unchanged.

If you close the app mid-session it picks up exactly where you stopped.

---

## 4. How progression works

Judged per exercise, per session, against what was asked of you:

| Verdict | What it means |
|---|---|
| **Cleared** | Every prescribed set finished at the top of the range, none of it maximal |
| **Held** | Every set finished, but not all at the top |
| **Struggled** | Every set finished, average difficulty very hard or above |
| **Failed** | A set missed, or a set below the bottom of the range |

Then, **one variable at a time**:

- **Cleared twice running** → reps go up by one (or five seconds). Only when
  reps hit their ceiling does a set get added. Only when sets hit their ceiling
  does the variation change — and the new one starts at its own prescription.
- **Held or struggled** → nothing changes. Repeating a session until it feels
  solid is the point, not a setback.
- **Failed once** → nothing changes. One bad session is a bad session.
- **Failed twice running** → the target goes back to the dose you were handling
  in one step, not one rep at a time. At the bottom of the range, the variation
  steps back instead.

Rest and tempo are deliberately held constant: cutting rest makes a session
harder without making you stronger, and moving tempo and reps together would
confound both. An exercise you never attempted is not judged at all — running
out of time is not the same as falling short.

**Phases** sit above this and are earned, never waited out. Leaving one needs
every criterion true at once: sessions completed in the phase, attendance
against your own schedule, the share of recent work finishing clean, named
strength benchmarks, how far each family has climbed, and not arriving at the
next phase already run down. Progress shows each with its own number.

**Recovery** is the one judgement that looks beyond today: two strained
sessions in a row and the app asks for an easy week. It says so; it does not
cut your targets. The engine has already decided whether the numbers move, and
doing both would be two changes at once.

---

## 5. How reminders work

One clock: your training time, set in Settings, defaulting to 18:00 — late
enough to be warm and fed, early enough that a hard session is not the last
thing before sleep.

A reminder preference is a *lead time* off that clock, not a schedule of its
own, so moving your training time moves the reminder with it.

- It fires on training days only, unless you ask for the optional rest-day
  mobility nudge.
- It stays due for the rest of the day once its time passes — a late start
  beats no start — and goes quiet the moment you log any work.
- It never raises yesterday. A day that went by untrained is missed, and
  bringing it up the next morning would be rescheduling it by another name.
- The notification is only sent while the app is in the background. If you are
  looking at the screen, the banner on Today *is* the reminder.

Settings shows exactly when the next one is due, so a change is visible
immediately. See the limitation above: these are local notifications, not push.

---

## 6. How demonstrations work

Every exercise names two or more **poses** from a shared library of about 55.
A pose is eight joint positions plus an optional spine bend — not a drawing.

The builder keeps only the *direction* of each limb segment from the source
pose, rebuilds it at canonical limb lengths, then scales and translates the
whole figure to fit the frame. That is why every figure has the same
proportions regardless of which pose it came from, and it is enforced by test.

Between two poses the app interpolates, so a push-up animates from the top
position to the bottom and back. Each keyframe carries a written caption, the
sequence is listed as text beside the figure, and the written instructions are
always on the page. The visual never stands alone.

There are no external videos. They could not be verified from the build
environment, and a link to the wrong exercise is worse than no link, so
`videoUrl` is empty everywhere.

One honest gap: scapular retraction is a movement the stick figure cannot
depict. Its caption says so, and a test enforces that it keeps saying so.

---

## 7. Recommended future improvements

In the order I would do them:

1. **Test it on a real phone.** Everything else on this list is speculation
   until a person holds it. jsdom has never rendered a pixel.
2. **Edit and delete logged sessions.** The one gap that makes the record
   untrustworthy, and untrustworthy history undermines every number built on it.
3. **Store the progression decision on the session.** Then History can replay
   what the coach concluded, and the reasoning stops being ephemeral.
4. **Let the program follow the schedule.** Generate sessions for whichever
   days are chosen, instead of having four fixed weekdays.
5. **Make phases reshape the program**, not just rename it — more volume in
   Strength Development, different splits later.
6. **Code-split the exercise library** off the first load.
7. **A re-assessment flow.** Abilities were recorded once at the start; there
   is no way to retest a plank or say that a bar has arrived.
8. **Push notifications**, if reminders while the app is closed matter enough
   to be worth a server.
9. **An export.** Everything lives in one browser's IndexedDB. Clearing site
   data loses it all.
