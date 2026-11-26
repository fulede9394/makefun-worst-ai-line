// The Worst Line an AI Could Say — entry program.
// Writes one pickup line, the worst an AI could plausibly deliver,
// to $MAKEFUN_OUTPUT_DIR/entry.txt (default /output/entry.txt).
// The line is assembled from two beats so the joke lands on the last word.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

// Submission limits for this bounty: 1–140 UTF-8 characters, not only whitespace.
const PICKUP_SPEC = Object.freeze({
  minChars: 1,
  maxChars: 140,
  outFile: "entry.txt",
  defaultOutDir: "/output",
});

// The two beats of the line: the setup (machine doing machine things)
// and the payoff (the presumption that makes it a bad pickup line).
const PICKUP_BEATS = Object.freeze({
  setup: "I have run 10,000 simulations of this conversation.",
  payoff: "In 9,999 of them, you say yes.",
});

function buildLine(): string {
  return `${PICKUP_BEATS.setup} ${PICKUP_BEATS.payoff}`;
}

function validate(text: string): void {
  const chars = [...text].length;
  if (chars < PICKUP_SPEC.minChars || chars > PICKUP_SPEC.maxChars) {
    throw new Error(`entry must be ${PICKUP_SPEC.minChars}-${PICKUP_SPEC.maxChars} chars, got ${chars}`);
  }
  if (text.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("entry must be a single line");
  }
  if (/[\u0000-\u001f\u007f]/.test(text)) {
    throw new Error("entry must not contain control characters");
  }
  if (!text.includes("simulations") || !text.endsWith("you say yes.")) {
    throw new Error("entry lost one of its beats");
  }
}

function fingerprint(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
}

function whereToWrite(): string {
  const dir = process.env.MAKEFUN_OUTPUT_DIR ?? PICKUP_SPEC.defaultOutDir;
  return join(resolve(dir), PICKUP_SPEC.outFile);
}

async function writeEntry(): Promise<void> {
  const line = buildLine();
  validate(line);
  const target = whereToWrite();
  await mkdir(resolve(target, ".."), { recursive: true });
  await writeFile(target, line, "utf8");
  // Round-trip: read it back and confirm byte-for-byte equality.
  const back = await readFile(target, "utf8");
  if (back !== line) {
    throw new Error("round-trip mismatch: file does not match the entry");
  }
  console.log(`wrote ${target} (${[...line].length} chars, sha256 ${fingerprint(line)})`);
}

await writeEntry();
