<!-- SHARED DOCUMENT: identical in ohmycoach-mobile, ohmycoach-backend, ohmycoach-web-admin and ohmycoach-marketplace. Do not edit in a single repository. -->

# 04. Workout Block Model

> Decisions: D-004, D-024, D-027, D-029 to D-038, D-047, D-054.
> Machine-readable contract: `workout-schema/workout.schema.json` (JSON Schema draft 2020-12). Six real advanced programs converted to JSON live in `workout-schema/examples/` and all validate (`python workout-schema/validate.py`). The seed catalogs are `workout-schema/seed_movement_catalog.json` and `workout-schema/seed_pr_catalog.json`.
> The FastAPI OpenAPI document and this JSON Schema are the **only** contract sources. Repositories must generate or validate against them instead of copying contracts by hand (D-043).

## 1. Model overview

```
Program (CLASS | ADVANCED | CUSTOM | MARKETPLACE)
 └─ Workout (one day)            status DRAFT | PUBLISHED, revision
     └─ Block[]                  one numbered coach section, has block_type and stable block_id
         └─ Part[]               lettered sub-section A, B, C with its own structure
             └─ movements / sets / intervals / versions ...
```

- A **workout** is a day inside a program. Metadata: `title`, optional `track_label` (for example "Competitors Track"), `estimated_duration_minutes`, `intention`, `closing_note`.
- A **block** is one numbered section of the coach's programming. It has a `block_type`, a title, optional `optional`/`scored` flags, a `coaching` object, block-level `media_links`, and one or more **parts**.
- A **part** has a `structure` that decides which fields it uses. Each part can have its own videos and an `optional` flag. A block has **one completion checkbox**, parts add none (D-034).
- `block_id` and `part_id` are stable across edits of a published workout; athlete logs are attached to them.

## 2. Block types (D-030)

| `block_type` | Typical parts | What it is | Example |
| :-- | :-- | :-- | :-- |
| `WARM_UP` | `TEXT` | Warm-up and activation. Free text lines, videos, no `movement_key`, not scored. | Banded 7s, hip halo, barbell prep |
| `STRENGTH` | `SETS` | Heavy work of a single lift with sets, reps, percentage/RPE and rests. | Front Squat 10 x 3 at 78-83% |
| `STRENGTH_COMPLEX` | `SETS` | Several movements chained without releasing the bar. | Clean Pull + Hang Power Clean + Power Clean |
| `INTERVALS` | `INTERVALS` | Work on a repeating clock: every N seconds for M intervals (EMOM style, 30 s, 60 s, 2:30...). Intervals can alternate or change by range. | Every 1 min for 15 min, Power Snatch x5 |
| `ACCESSORY` | `ROUNDS` | Rounds "for quality" of several movements, with rest, rep ranges and per-side counts. | 3-4 rounds: Single Leg RDL + hamstring curl |
| `METCON` | `WOD` | The conditioning piece. May be scored. Has `RX` and `SCALED` versions. | 7 rounds for time of Deadlift and HSPU |
| `SKILL` | `WORK_REST`, `SETS`, `LADDER`, `ROUNDS` | Technical practice, gymnastics included. | Jump rope: Tabata, 10 x 15 double unders, ladder |
| `COOL_DOWN` | `TEXT` | Recovery and stretches. | Easy cardio + seal stretch |
| `CUSTOM` | any | Free block defined by the coach. | Anything else |

`EMOM` and `EMOM_ALT` no longer exist; `GYMNASTICS` is merged into `SKILL`.

## 3. Part structures

| `structure` | Main fields | Used for |
| :-- | :-- | :-- |
| `TEXT` | `lines[]` | Warm-up, cool-down, notes |
| `SETS` | `movements[]`, `sets[]` (each with `sets` count or range, `reps`, `load`, `rest`, `time_cap_seconds`), `ramp_up[]`, `percentage_reference`, `rest` | Strength and complexes |
| `ROUNDS` | `rounds` (number or range), `movements[]` (movement or rest lines), `rest_between_movements`, `rest_between_rounds` | Accessory work |
| `INTERVALS` | `interval_seconds`, `total_intervals`, `intervals[]` (each with `applies_to`: `ALL`, `ODD`, `EVEN` or `from`/`to`, and `movements[]`), `percentage_reference` | EMOM-style work |
| `WORK_REST` | `rounds`, `work_seconds`, `rest_seconds`, `movements[]` | Tabata-like patterns |
| `LADDER` | `rep_scheme[]`, `repeats`, `movement`, `rest` | Ladders such as 5-10-15-20-25-20-15-10-5 |
| `WOD` | `wod_format` (`FOR_TIME`, `AMRAP`, `INTERVALS`), `time_cap_seconds`, `duration_seconds`, `interval_time_cap_seconds`, `targets`, `versions` | Metcons |

Every part also accepts `part_id`, `label` (A, B, C), `title`, `optional`, `lines[]`, `media_links[]` and `notes`.

### Reusable definitions
- **Quantity** `{ value, unit }` with units `LB`, `KG`, `M`, `KM`, `FT`, `IN`, `CM`, `CAL`. **Gendered** `{ men, women }` holds a quantity per column and is used for loads, distances, heights (deficits) and calories; the app picks the column by `rx_standard` (D-028).
- **Rest line** (D-071): `{ "rest": Rest }` placed between movement lines in a `WOD` version, a `ROUNDS` part or an `INTERVALS` group. It splits the sequence into for-time stretches and repeats with `rounds`; a rest after the last movement of the last round is not performed. Use `rest_between_rounds` / `rest_between_movements` only for uniform rests in `ROUNDS`.
- **Reps**: an integer, a range `{ min, max }`, or `"MAX"`. A movement line may instead carry `reps_by_round` (for example `[9, 7, 5]`) and `per_side`.
- **Load** (one style per line): `percentage`, or `percentage_min` + `percentage_max`, or `rpe` (number or range), or `weight` (Quantity or Gendered), plus flags `athlete_choice` and `empty_bar`. Percentages are calculated against the part's `percentage_reference` (section 6).
- **Rest**: `min_seconds`, `max_seconds`, `as_needed`, `notes`.
- **Movement line**: `movement_key` (optional), `name`, reps, `duration_seconds`, `distance`, `calories`, `height`, `load`, `notes`, and `media_links[]` for a per-movement video (D-036). A line **without** `movement_key` is a free-text movement (D-029).
- **Media link**: `type` (`YOUTUBE`, `GOWOD`, `OTHER`), `label`, `url`.
- **Coaching** (block level): `intention`, `stimulus`, `form_cues[]`, `strategy[]` (per movement), `substitutions[]`, `intensity`. The mobile app renders it as collapsible sections.
- **Targets** (informational only): `target_time_seconds`, `target_rounds`, `minimum_reference_rounds`, `per_interval_target_seconds`, `rpe`, `intensity_percent`.

## 4. Metcons: versions and scoring

A `WOD` part has `versions` with a required `RX` and an optional `SCALED`, each a complete definition (its own movements, reps, loads, rounds). Scaled versions can change reps and distance, not only weight.

A block is `scored: true` only if it is a `METCON` with a single `WOD` part whose `wod_format` is `FOR_TIME` or `AMRAP` (the schema enforces it). Scoring rules are in `02-business-rules.md` section 8. Additional validation done by the backend (not expressible in JSON Schema):
- `AMRAP` scored requires fixed repetitions per round: every line of the scored version has a fixed integer `reps`, `calories` or `distance` (gendered values resolved by `rx_standard`); each calorie or distance unit counts as one repetition for the total. Ranges, `MAX`, `reps_by_round` and time-only lines are rejected; such an `AMRAP` can still be published unscored.
- `CAP + N` requires every movement of the scored version to be rep-based and the total repetitions to be computable; otherwise only the finishing time or plain `CAP` is captured.
- `INTERVALS` WODs (for example a score by the sum of times) are displayed but never scored (D-037).
- A scored `FOR_TIME` may contain rest lines (D-071): the score is the total clock time, rests included, and the time cap runs on the same clock. Rest lines are ignored by the fixed-repetitions rule of a scored `AMRAP` and by `CAP + N`.

Compact example of a scored metcon:

```json
{
  "block_id": "b7", "block_order": 7, "block_type": "METCON",
  "title": "Army Black Knights", "scored": true,
  "parts": [{
    "part_id": "b7-p1", "structure": "WOD", "wod_format": "FOR_TIME",
    "time_cap_seconds": 540,
    "targets": { "target_time_seconds": 360 },
    "versions": {
      "RX": { "rounds": 3, "movements": [
        { "movement_key": "POWER_SNATCH", "name": "Power Snatch", "reps_by_round": [9, 7, 5],
          "load": { "weight": { "men": { "value": 135, "unit": "LB" }, "women": { "value": 95, "unit": "LB" } } } },
        { "movement_key": "BURPEE_BAR_MUSCLE_UP", "name": "Burpee Bar Muscle-Up", "reps_by_round": [9, 7, 5] }
      ] },
      "SCALED": { "rounds": 3, "movements": [
        { "movement_key": "POWER_SNATCH", "name": "Power Snatch", "reps_by_round": [9, 7, 5],
          "load": { "weight": { "men": { "value": 115, "unit": "LB" }, "women": { "value": 80, "unit": "LB" } } } },
        { "movement_key": "BURPEE_BAR_MUSCLE_UP", "name": "Burpee Bar Muscle-Up", "reps_by_round": [7, 5, 3] }
      ] }
    }
  }]
}
```

## 5. Strength example (percentages, ramp-up, variable sets)

```json
{
  "block_id": "b2", "block_order": 2, "block_type": "STRENGTH", "title": "Snatch Balance",
  "coaching": { "intention": "High percentages to build confidence in the deep catch." },
  "parts": [{
    "part_id": "b2-p1", "structure": "SETS", "percentage_reference": "SNATCH_BALANCE",
    "movements": [{ "movement_key": "SNATCH_BALANCE", "name": "Snatch Balance" }],
    "sets": [
      { "sets": 1, "reps": 1, "load": { "percentage": 0.68 }, "rest": { "min_seconds": 120, "max_seconds": 120 } },
      { "sets": 1, "reps": 1, "load": { "percentage": 0.73 }, "rest": { "min_seconds": 120, "max_seconds": 120 } }
    ],
    "ramp_up": [
      { "load": { "empty_bar": true }, "reps": 5 },
      { "load": { "percentage": 0.40 }, "reps": 3 }
    ]
  }]
}
```

## 6. Percentage references and Personal Records (D-024, D-035, D-038, D-047)

- `percentage_reference` lives on the **part** (`SETS` and `INTERVALS` structures). It is a PR key from the PR catalog (`STRENGTH` and `WEIGHTLIFTING` sections). The backend must reject a reference that is not in the PR catalog.
- The reference is independent of the movement performed: 90% of `SQUAT_CLEAN` can prescribe a Deadlift + Clean Pull complex.
- The movement catalog's `pr_family` only **pre-selects** the reference in the builder (for example `HANG_POWER_CLEAN` -> `POWER_CLEAN`). The coach can override it, and it never changes calculations.
- Naming: `Clean` is `SQUAT_CLEAN` and `Snatch` is `SQUAT_SNATCH` (D-031). Power variations are `POWER_CLEAN` and `POWER_SNATCH`.
- RPE, `athlete_choice` and absolute weights never use a PR.

## 7. Catalogs

- **Movement catalog**: global, edited only by `SUPER_ADMIN` (D-029). Entries: `movement_key` (uppercase letters, digits and underscore), `name`, optional `pr_family`. The seed has 46 movements extracted from prescription blocks of the six sample programs; warm-up and cool-down lines stay free text. Example key choices: `KB_SUITCASE_HOLD` (D-040), `SQUAT_SNATCH`, `POWER_CLEAN`.
- **PR catalog**: the movements an athlete can capture a 1RM for (`seed_pr_catalog.json`): `STRENGTH` (`BACK_SQUAT`, `DEADLIFT`, `BENCH_PRESS`, `OVERHEAD_STRICT_PRESS`) and `WEIGHTLIFTING` (`FRONT_SQUAT`, `POWER_SNATCH`, `SQUAT_SNATCH`, `SNATCH_BALANCE`, `POWER_CLEAN`, `SQUAT_CLEAN`, `POWER_CLEAN_AND_JERK`, `SPLIT_JERK`, `OVERHEAD_SQUAT`).

## 8. Which sample program covers which pattern

| File in `workout-schema/examples/` | Patterns it exercises |
| :-- | :-- |
| `monday.json` | Percentage range over 10 sets, ramp-up, weighted pull-up as text parts, accessory rounds, optional core, scored FOR_TIME with `reps_by_round` and RX/SCALED |
| `tuesday.json` | Complex with per-set percentage ranges, deficit HSPU with gendered height, RPE range sets, strongman carries with feet, scored run + GHD + toes-to-bar |
| `wednesday.json` | Mixed fixed and range percentages, cross-lift reference (Deadlift + Clean Pull at 90% of `SQUAT_CLEAN`), per-movement video, scored AMRAP with calories |
| `friday.json` | Variable set count, RPE-driven EMOM with ranges of intervals, chipper FOR_TIME with scaled variants, `track_label` |
| `friday2.json` | Eleven single sets with changing percentages, interval WOD on a 2:30 clock with ODD/EVEN movements (not scored) |
| `another.json` | RPE complexes, power clean at 75-78% every minute, optional interval deadlift, 7-round FOR_TIME, jump-rope `WORK_REST` + `SETS` + `LADDER` |
| `competition.json` | Rest lines (D-071): scored 6 rounds each for time with 2:00 rest inside the clock, accessory rounds with a rest in the middle of the round and `MAX` reps, unscored row/run with rests between stretches, RX and SCALED |

## 9. Rules that stay as text in the MVP (D-032, D-037)

- A load derived from a result of the same session (for example 20% of today's 3RM) is plain text in a `TEXT` part.
- Interval WODs scored by the sum of times are displayed, not scored.
- WOD targets are informational.

## 10. Validation workflow

1. The builder produces JSON that conforms to the schema.
2. The backend validates every `POST`/`PUT` of a workout against `workout.schema.json` (Pydantic models generated from or checked against it) and then applies the extra rules above.
3. The mobile and web clients generate their types from the OpenAPI/JSON Schema.
4. `python workout-schema/validate.py` re-validates the examples whenever the schema changes (run it in CI).

## 11. Spanish display labels (D-068)

Labels that come from the model (not from the coach's text) use these Spanish terms in the mobile app and the web admin, so the coach and the athlete read the same words. CrossFit jargon stays in English because that is how athletes use it. Locale files keep English source strings (D-053); this table fixes the `es` value. Coach-written text (titles, lines, notes, `track_label`) is shown as written.

| Model value | `en` source | `es` label |
| :-- | :-- | :-- |
| `WARM_UP` | Warm-up | Calentamiento |
| `STRENGTH` | Strength | Fuerza |
| `STRENGTH_COMPLEX` | Strength complex | Complejo de fuerza |
| `INTERVALS` (block and `wod_format`) | Intervals | Intervalos |
| `ACCESSORY` | Accessory | Accesorios |
| `METCON` | Metcon | Metcon |
| `SKILL` | Skill | Skill |
| `COOL_DOWN` | Cool down | Cool down |
| `CUSTOM` | the block `title`; fallback "Block" | the block `title`; fallback "Bloque" |
| `FOR_TIME` | For Time | For Time |
| `AMRAP` | AMRAP | AMRAP |
| `RX` / `SCALED` | RX / Scaled | RX / Scaled |
| `WORK_REST` (Tabata-like) | Tabata (when 20/10 x 8), otherwise Work / rest | Tabata (cuando es 20/10 x 8), si no Trabajo / descanso |
| `LADDER` | Ladder | Escalera |
| `time_cap_seconds` | Time cap | Time cap |
| Interval clock | Every {mm:ss} x {n} | Cada {mm:ss} x {n} |
| `applies_to` `ODD` / `EVEN` | Odd / Even | Impares / Pares |
| rounds / sets / reps | rounds / sets / reps | rondas / series / reps |
| `reps` `MAX` | Max | Máx. |
| `per_side` | per side | por lado |
| `ramp_up` | Ramp-up | Aproximaciones |
| `rest`, `as_needed` | Rest, as needed | Descanso, según necesites |
| `optional` | Optional | Opcional |
| `empty_bar` / `athlete_choice` | Empty bar / Athlete's choice | Barra vacía / A elección |
| `rpe`, 1RM | RPE, 1RM | RPE, 1RM |
| `coaching`: `intention`, `stimulus`, `form_cues`, `strategy`, `substitutions`, `intensity` | Intention, Stimulus, Form cues, Strategy, Substitutions, Intensity | Intención, Estímulo, Puntos clave, Estrategia, Sustituciones, Intensidad |
| `targets` | Target | Objetivo |
| `metadata.estimated_duration_minutes`, `closing_note` | Estimated duration, Closing note | Duración estimada, Nota final |

The word `EMOM` is not used as a label: `INTERVALS` covers any interval length (D-030), so the clock line shows the actual interval ("Cada 1:00 x 10"). Units keep their symbols (`lb`, `kg`, `m`, `km`, `ft`, `in`, `cm`, `cal`).

### Numbers and ranges
- Numbers use the `es-MX` locale in every client: decimal point and comma for thousands (`8.5`, `2.5 kg`, `1,000 m`).
- A range (`{ min, max }` for reps, sets, rounds, RPE, percentages, rest) is written with an en dash and a space on each side, and its unit once at the end: `RPE 8.5 – 9`, `78 – 83%`, `4 – 5 rondas`, `10 – 15 reps`.
- `reps_by_round` schemes are not ranges and keep a plain hyphen without spaces: `9-7-5`.
- Mobile and the web admin each use one shared range formatter, so the builder preview and the app show the same text.
