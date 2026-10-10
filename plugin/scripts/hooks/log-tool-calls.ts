import { join } from "node:path";
import { createObserver, appendLog } from "@wycats/agent-hooks";

const LOG_DIR =
  process.env.CLAUDE_PLUGIN_DATA ?? join(process.env.HOME ?? "", ".ai-plugin");

createObserver({
  name: "tool-call-logging",
  handle(event) {
    appendLog(LOG_DIR, "tool-call-log.jsonl", {
      event: event.event,
      tool: event.tool,
      rawTool: event.rawTool,
      input: event.input,
    });
  },
});
