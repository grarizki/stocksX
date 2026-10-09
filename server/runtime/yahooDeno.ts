import { platform } from "node:os";
import { isatty } from "node:tty";

// yahoo-finance2 only needs platform detection and terminal-aware logging.
// Its full Node Deno shim eagerly initializes unsupported filesystem globals.
export const Deno = {
	build: {
		os: platform() === "win32" ? "windows" : platform(),
	},
	stdout: {
		isTerminal: () => isatty(1),
	},
};
