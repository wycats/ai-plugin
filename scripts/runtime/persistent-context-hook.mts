import { renderPersistentInstructions } from "./persistent-context.mjs";

const additionalContext = await renderPersistentInstructions();
// Keep the complete instructions within the configured hook budget. Fail
// visibly rather than allowing the host to spill most of the content to disk.
if (Buffer.byteLength(additionalContext, "utf8") > 48000) {
  throw new Error("Persistent plugin context exceeds 48 KB; review its size and delivery budget.");
}
process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: "SessionStart", additionalContext },
}));
