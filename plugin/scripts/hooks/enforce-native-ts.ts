import { createPolicy } from "@wycats/agent-hooks";

createPolicy({
  name: "native-ts-enforcement",
  tool: "terminal",
  check({ command }) {
    if (!command) return;

    if (/\b(tsx|ts-node|babel-node|npx\s+tsx)\b/.test(command)) {
      return {
        deny: `This environment uses Node 24+ which runs TypeScript natively. Replace the loader with "node" in the command: ${command}`,
      };
    }
  },
});
