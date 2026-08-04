# Show Tiva — Admin Dashboard Integration Spec

Everything the admin dashboard can read and write, verified against the running
app and independently audited.

- **Base URL (dev):** `http://localhost:3000`
- **Format:** JSON in, JSON out. No auth headers required *(see [Before production](#1-read-this-first))*.
- **Effect of a write:** the public pages re-read on the next request. No rebuild, no restart.

---

## 1. Read this first

| # | Issue | What it means for the dashboard |
|---|---|---|
| 1 | **There is no authentication.** Every endpoint is open to anyone who can reach the server. | Do not expose this to the internet as-is. Auth must be added before launch — it cannot be faked client-side. |
| 2 | **Writes return `503` in production.** The store is a JSON file; most production hosts have a read-only filesystem. | Writes work locally and on a server with a persistent disk (`ALLOW_CONTENT_WRITES=true`). For real production this should move to a database — see [Swapping the storage](#10-swapping-the-storage). |
| 3 | **Single instance only.** Writes are serialized within one Node process. | Do not run multiple app instances against the same file. |

### Error responses

Every failure uses the same envelope:

```jsonc
{ "error": "A movie with id \"t1\" already exists" }

// Some errors add machine-readable detail:
{ "error": "Unsupported field(s): bogus", "details": { "editable": ["title", "…"] } }
{ "error": "Unknown role \"boss\"",       "details": { "roles": ["family", "creator"] } }
```

| Code | When |
|---|---|
| `200` OK · `201` Created | — |
| `400` | Malformed JSON, non-object body, an unsupported field, **or a field with the wrong type** (message names the path, e.g. `content.json: movies.t1.cast must be an array`) |
| `404` | Unknown movie id, section id, or role |
| `409` | `POST` with an id that already exists |
| `503` | Write attempted in production |
| `500` | Store unreadable or an unexpected fault |

---

## 2. Two separate stores

| Store | File | Holds |
|---|---|---|
| Catalog | `data/content.json` | Movies, catalog rows, hero slide order, default cast |
| Site copy | `data/site.json` | Landing page copy + background videos, per audience |

Kept separate so a bad copy edit cannot take down the movie catalog.

---

## 3. Catalog API

### Data model — `Movie`

```jsonc
{
  "id": "t1",                    // IMMUTABLE — the object key. PUT cannot change it.
  "title": "Soul",
  "subtitle": null,              // string | null  ⚠️ NOT RENDERED ANYWHERE (see §6)
  "type": null,                  // string | null  — UI shows "Movie" when null
  "duration": "1h 34m",          // required, non-empty. Hero slides render "Duration {value}"
  "rating": "9.2",               // STRING, not number
  "year": "2020",                // STRING, not number
  "description": "A New York jazz pianist…",
  "image": "https://…",          // poster / card artwork
  "backdrop": "https://…",       // wide art for the detail page hero
  "genres": ["Drama", "Musical"], // array of strings
  "cast": [{ "name": "…", "role": "…", "image": "https://… | null" }],
  "trailerUrl": null             // string | null  ⚠️ an IMAGE url, not a video (see §6)
}
```

**Form-building notes**

- `rating`, `year`, `duration` are **strings** — send `"9.2"`, not `9.2`. Wrong types are rejected with `400`.
- All 12 editable fields are type-checked server-side. `duration` and `backdrop` must be non-empty strings; `subtitle`, `type`, `trailerUrl` may be `null`.
- `image` / `backdrop` / `trailerUrl` / `cast[].image` are **URLs**. There is no upload endpoint — uploads would need to be added.
- Current catalog: **80 movies** (76 in rows + 4 hero slides), **7 rows**.

### The `cast` field and `defaultCast`

`cast: []` means "fall back to the store's shared `defaultCast`" (8 entries, in
`GET /api/content`). The fallback is applied **only when rendering the page** —
every endpoint returns the **stored** value, so `cast` round-trips safely: read a
movie, PUT it back unchanged, and it still inherits.

All 80 movies currently store `cast: []`. Send entries to override per title;
send `cast: []` to restore inheritance.

### Editable fields (`PUT` / `PATCH`)

`title`, `subtitle`, `type`, `duration`, `rating`, `year`, `description`,
`image`, `backdrop`, `genres`, `cast`, `trailerUrl`

Anything else → `400` with the allowed list in `details.editable`.

### Endpoints

| Method | Path | Response |
|---|---|---|
| `GET` | `/api/content` | The whole catalog store (see §2 shape) |
| `GET` | `/api/movies` | `{ count, movies[] }` |
| `GET` | `/api/movies?section=<id>` | `{ section, count, movies[] }` — row order |
| `POST` | `/api/movies` | `{ movie, section }` · `201` |
| `GET` | `/api/movies/:id` | `{ movie, related[] }` |
| `PUT` / `PATCH` | `/api/movies/:id` | `{ movie }` — the saved record |
| `DELETE` | `/api/movies/:id` | `{ deleted: "<id>" }` |
| `GET` | `/api/sections` | `{ count, sections[] }` |

**`GET /api/content`** shape:

```jsonc
{ "version": 1, "updatedAt": "2026-08-04T…Z",
  "defaultCast": [ … ], "heroSlideIds": ["spiderman", …],
  "sections": [ { "id", "title", "titleColor", "aspect", "accent", "movieIds": [] } ],
  "movies": { "t1": { …Movie }, … } }        // keyed by id, NOT an array
```

**`GET /api/sections`** → `{ count, sections[] }`. Each entry has `id`, `title`,
`titleColor`, `aspect` (`portrait` | `landscape`), `accent` (hex heading colour),
`movies[]` (full records), `movieCount`.

**`POST /api/movies`** — required: `id`, `title`, `image`, `rating`, `year`,
`description`. Optional: any other `Movie` field, plus `sectionId` to place it in
a row. Defaults: `duration` `"1h 30m"`, `backdrop` ← `image`, `subtitle` / `type`
/ `trailerUrl` `null`, `genres` `[]`, `cast` `[]`. Note `genres` and `cast` are
coerced to `[]` if you send a non-array — they are not rejected on create.
Duplicate id → `409`.

**`DELETE /api/movies/:id`** also strips the id from every row's `movieIds` and
from `heroSlideIds`, so no dangling references remain.

---

## 4. Landing page API

### Data model

```jsonc
{
  "heroSub": "100% WHOLESOME SHOWS",   // small eyebrow above the headline
  "heroTitle": { /* see below */ },
  "heroDesc": "We feed families clean, safe…",
  "bannerHeadline": "Trusted Entertainment Studio",
  "bannerDesc": "Every single animation is fully vetted…",
  "videos": ["/bg_video_1.mp4", "…"]   // background stripes, in display order
}
```

**`heroTitle` has two modes** — the dashboard needs a mode switch:

```jsonc
// Animated: renders  "{prefix} {staticWord} <rotating word>"
{ "mode": "rotating", "prefix": "Trusted", "staticWord": "Family",
  "rotatingWords": ["Shows", "Movies", "Series"] }

// Fixed: renders one sentence
{ "mode": "plain", "text": "Co-Create the Future of Family Shows" }
```

> ⚠️ **`heroTitle` is replaced wholesale, never deep-merged.** Always send the
> complete object. `{"heroTitle":{"rotatingWords":["A","B"]}}` drops `mode`,
> `prefix` and `staticWord` and is rejected with `400`.

`staticWord` and the rotating word stay on one line. Today `family` uses
`rotating` and `creator` uses `plain`, but either role can use either mode.

**`videos`** — any number works, not fixed at 5; must be non-empty. The layout
divides width evenly and the reveal stagger is computed per index. Paths are
served from `public/` (existing: `bg_video_1..5.mp4`, `creator_video_1..5.mp4`).

### Two audiences

`role` is `family` or `creator`, chosen by `?role=` on the landing URL. Anything
unrecognised falls back to `family`.

### Endpoints

| Method | Path | Response |
|---|---|---|
| `GET` | `/api/site` | The whole site store |
| `GET` | `/api/site/landing/:role` | `{ role, content, introMinimizeDelayMs, stripeStaggerSeconds }` |
| `PUT` | `/api/site/landing/:role` | `{ role, content }` — the saved copy |

**`GET /api/site`** shape:

```jsonc
{ "version": 1, "updatedAt": "…",
  "landing": { "introMinimizeDelayMs": 2200, "stripeStaggerSeconds": 0.3,
               "roles": { "family": { …content }, "creator": { …content } } } }
```

**Editable via `PUT`:** `heroSub`, `heroTitle`, `heroDesc`, `bannerHeadline`,
`bannerDesc`, `videos`. Anything else → `400`. Unknown role → `404`.

```bash
curl -X PUT http://localhost:3000/api/site/landing/family \
  -H "Content-Type: application/json" \
  -d '{"heroSub":"NEW EYEBROW","videos":["/bg_video_3.mp4","/bg_video_1.mp4"]}'
```

---

## 5. Deliberately NOT editable

Left hardcoded by request — do **not** build fields for these:

- The **"Start watching"** button on the landing page
- The **"Coming soon"** CTA button

---

## 6. Fields that need a warning label

Editable and persisted, but they do not behave the way their name suggests.

| Field | Reality |
|---|---|
| `subtitle` | **Renders nowhere.** No component reads it — the current hero shows duration, title and description only. Editing it has no visible effect. Either hide it in the dashboard or treat it as notes-only. |
| `trailerUrl` | Rendered as the `src` of an **`<img>`**, not a video player. A YouTube link or `.mp4` will show a broken image. Supply a poster-frame **image URL**. Empty (`null`) falls back to the movie's `image`. |
| `titleColor` | **Dead data** on rows. Stored and returned by the API, but no component reads it; heading colour comes from `accent`. Do not surface it as a colour control. |

---

## 7. Gaps — readable but not yet writable

Returned by `GET`, but there is **no write endpoint**. Say the word and I'll add them.

| Item | Where | What the dashboard can't do yet |
|---|---|---|
| Row `title`, `accent`, `aspect` | `content.json → sections[]` | Rename a row or change its heading colour |
| Row order, `movieIds` order | `content.json → sections[]` | Reorder rows, reorder or move movies between rows |
| `heroSlideIds` | `content.json` | Choose which titles are hero slides, or their order |
| `defaultCast` | `content.json` | Edit the shared fallback cast |
| `introMinimizeDelayMs`, `stripeStaggerSeconds` | `site.json → landing` | Tune landing intro timing |

> A movie can be placed in a row at creation (`POST` with `sectionId`) and is
> removed from rows on `DELETE` — but rows cannot otherwise be re-arranged.

## 8. Still fully hardcoded (no store, no endpoint)

Each would need a schema + endpoint added first.

**Landing page** — nothing beyond §4 (the two buttons in §5 are intentional).

**Watch page**
- Footer: tagline, all three column headings (`Explore` / `Company` / `Legal`) and every link label, social links, footer background image
- Row controls repeated on every row: `View All`, and the two carousel arrows' labels
- Hero buttons: `Watch Now`, `Add List` / `Added`
- Card hover popover: the `Tv` and `EN` badges

**Detail page**
- Section headings: `Cast`, `Trailer`, `You may also like`
- Action buttons: `Play`, `Watchlist` / `In Watchlist`, and the download button
- The `4K` tag in the meta row
- Trailer labels: `"{title} — Official Trailer"` and `SHOWTIVA Originals`
- Its own footer (same content as the watch footer)

**Catalog 404 page** (`/watch/<unknown-id>`) — `Title not found`, `Back to browse`.
Relevant because `DELETE` makes this page reachable.

**Global** — the `SHOWTIVA` logo image, header icons, and the site-wide tab title
and description in `layout.tsx`.

> Already dynamic, no work needed: the **detail page's** tab title and meta
> description are generated from the movie's `title` and `description`, so
> editing those via `PUT /api/movies/:id` updates them.

---

## 9. Behaviour the dashboard can rely on

- **Type-checked before disk.** The whole store is re-validated before any write, covering **all** movie fields, row fields and hero ids. A bad payload is rejected with `400` naming the path, and the file is left untouched — a malformed edit cannot corrupt the catalog or crash the pages.
- **Atomic writes.** Written to a temp file then renamed, so a crash cannot truncate the store. The previous version is kept as `<file>.bak`.
- **Locked read-modify-write.** Each write re-reads inside the lock, so two overlapping edits cannot lose one another's changes.
- **`updatedAt`** is stamped automatically on every write (ISO 8601). Don't send it.
- **Immediate effect.** Affected pages are revalidated on write; the next request serves the new data.

## 10. Swapping the storage

All filesystem access sits behind `src/lib/json-store.ts`, with
`src/lib/content.ts` and `src/lib/site.ts` on top. Moving to a database means
rewriting those and leaving every endpoint and the whole front end untouched.
