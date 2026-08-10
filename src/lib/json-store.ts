// Shared JSON-file persistence used by every content store.
//
// Deliberate choices:
//  - `server-only` makes an accidental client import fail loudly instead of
//    producing a confusing "can't resolve fs" error deep in a build.
//  - Files are read with fs at request time and never imported as modules. A
//    static `import data from "../../data/x.json"` would be inlined at build
//    time and silently freeze the data.
//  - Writes go to a temp file in the same directory and are then renamed, so a
//    crash mid-write cannot leave a truncated file behind.
//  - Read-modify-write goes through `mutateJson`, which holds the lock across
//    BOTH the read and the write. Serializing only the write would still lose
//    updates: two overlapping requests would each read the same snapshot and
//    the second write would clobber the first.
import "server-only";

import { copyFile, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

export class StoreError extends Error {
  constructor(
    readonly file: string,
    readonly detail: string,
  ) {
    super(`${file}: ${detail}`);
    this.name = "StoreError";
  }
}

/**
 * The stored file could not be read, parsed, or satisfied its own schema.
 *
 * That is the server's problem, never the caller's, so it must answer 500 even
 * when the failure came from the validator. Fault used to be inferred by
 * regex-matching the message, which misread a hand-corrupted store as a bad
 * request: a GET carrying no body at all could answer 400, and the repair
 * PATCH was rejected as if its own payload were malformed.
 */
export class StoreUnreadableError extends StoreError {
  constructor(file: string, detail: string) {
    super(file, detail);
    this.name = "StoreUnreadableError";
  }
}

/**
 * True when a StoreError came from validating a caller's payload rather than
 * from the stored file being unusable. Those failures are caused by the
 * request, so callers should answer 400 rather than 500.
 */
export function isValidationError(cause: unknown): cause is StoreError {
  return cause instanceof StoreError && !(cause instanceof StoreUnreadableError);
}

function paths(file: string) {
  return {
    // Temp/backup live beside the target so `rename` stays atomic (it is only
    // atomic within a single volume).
    main: path.join(DATA_DIR, file),
    temp: path.join(DATA_DIR, `${file}.tmp`),
    backup: path.join(DATA_DIR, `${file}.bak`),
  };
}

/** Read + parse a store file, then hand it to a validator. Never cached. */
export async function readJson<T>(file: string, validate: (value: unknown) => T): Promise<T> {
  const { main } = paths(file);

  let raw: string;
  try {
    raw = await readFile(main, "utf8");
  } catch (cause) {
    throw new StoreUnreadableError(file, `could not read ${main}. ${(cause as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new StoreUnreadableError(file, `invalid JSON. ${(cause as Error).message}`);
  }

  // A schema failure here describes what is ON DISK, so it is a server fault
  // even though the same validator answers 400 when it rejects a payload.
  try {
    return validate(parsed);
  } catch (cause) {
    const detail = cause instanceof StoreError ? cause.detail : (cause as Error).message;
    throw new StoreUnreadableError(file, `stored data is invalid. ${detail}`);
  }
}

/** `rename` can transiently fail on Windows while a watcher holds the file. */
async function renameWithRetry(from: string, to: string, attempts = 3): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await rename(from, to);
      return;
    } catch (cause) {
      const code = (cause as NodeJS.ErrnoException).code;
      const retryable = code === "EPERM" || code === "EBUSY" || code === "EACCES";
      if (!retryable || attempt >= attempts) throw cause;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

/** Back up the current file, then atomically replace it. */
async function persist(file: string, contents: unknown): Promise<void> {
  const { main, temp, backup } = paths(file);

  // Keep the last good copy; ignore failure on a first-ever write.
  await copyFile(main, backup).catch(() => undefined);

  await writeFile(temp, JSON.stringify(contents, null, 2) + "\n", "utf8");
  await renameWithRetry(temp, main);
}

/**
 * Serializes every store write. Valid because a single Node process serves all
 * requests in dev and in `next start` — these stores are not safe across
 * multiple instances.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(job);
  // Keep the chain alive even if this job rejects.
  writeQueue = run.catch(() => undefined);
  return run;
}

/**
 * Validate, back up, then atomically replace a store file. Validation runs
 * before anything touches disk so a malformed payload cannot destroy the file.
 *
 * Prefer `mutateJson` when the new value is derived from the current one.
 */
export async function writeJson<T>(
  file: string,
  next: T,
  validate: (value: unknown) => T,
): Promise<T> {
  return enqueue(async () => {
    const validated = validate(next);
    await persist(file, validated);
    return validated;
  });
}

/**
 * Read-modify-write under a single lock. The read happens inside the lock, so
 * concurrent mutations queue up and each sees the previous one's result.
 */
export async function mutateJson<T>(
  file: string,
  validate: (value: unknown) => T,
  mutator: (current: T) => T | Promise<T>,
): Promise<T> {
  return enqueue(async () => {
    const current = await readJson(file, validate);
    const validated = validate(await mutator(current));
    await persist(file, validated);
    return validated;
  });
}
