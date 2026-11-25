import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENTRY = "9";

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function main(): void {
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  const entryPath = join(outputDir, "entry.txt");

  const payload = ENTRY;
  const text = `${payload}\n`;

  if (payload.length < 1 || payload.length > 5) {
    fail(`entry must be 1..5 characters, got ${payload.length}`);
  }
  if (!/^[0-9]+$/.test(payload)) {
    fail(`entry must be digits only, got ${JSON.stringify(payload)}`);
  }

  const bytes = Buffer.from(text, "utf8");
  if (bytes.length < 1 || bytes.length > 5) {
    fail(`entry must be 1..5 bytes, got ${bytes.length}`);
  }
  if (bytes[bytes.length - 1] !== 0x0a) {
    fail("entry must end with exactly one trailing newline");
  }
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] < 0x30 || bytes[i] > 0x39) {
      fail(
        `byte ${i} is 0x${bytes[i].toString(16).padStart(2, "0")}, not an ASCII digit (0x30-0x39)`,
      );
    }
  }
  if (bytes.includes(0x0a, 0) && bytes.indexOf(0x0a) !== bytes.length - 1) {
    fail("entry must contain no newline except the single trailing one");
  }

  mkdirSync(outputDir, { recursive: true, mode: 0o755 });
  writeFileSync(entryPath, bytes, { mode: 0o644 });
  try {
    chmodSync(entryPath, 0o644);
  } catch {
    // chmod is best-effort on platforms without POSIX modes.
  }

  const readBack = readFileSync(entryPath);
  if (!readBack.equals(bytes)) {
    fail(
      `read-back mismatch: expected ${bytes.toString("hex")}, got ${readBack.toString("hex")}`,
    );
  }

  const fileSize = readBack.length;
  console.log(`path:        ${entryPath}`);
  console.log(`payload:     ${JSON.stringify(payload)}`);
  console.log(`text:        ${JSON.stringify(readBack.toString("utf8"))}`);
  console.log(`characters:  ${[...readBack.toString("utf8")].length}`);
  console.log(`bytes:       ${bytes.length}`);
  console.log(`file size:   ${fileSize}`);
}

main();
