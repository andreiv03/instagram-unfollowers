import { readFile, writeFile } from "node:fs/promises";
import { bundle } from "./bundle.js";

const README = new URL("../README.md", import.meta.url);
const FENCE = "```";
const SNIPPET = /<!-- snippet:start -->\s*```js\n[\s\S]*?```\s*<!-- snippet:end -->/;

const readme = await readFile(README, "utf8");
if (!SNIPPET.test(readme)) throw new Error("README.md is missing the snippet markers.");

const code = await bundle();
const block = `<!-- snippet:start -->\n${FENCE}js\n${code}\n${FENCE}\n<!-- snippet:end -->`;
const updated = readme.replace(SNIPPET, () => block);

if (process.argv.includes("--check")) {
	if (updated !== readme) {
		console.error("README.md snippet is out of date. Run `npm run build`.");
		process.exitCode = 1;
	}
} else {
	await writeFile(README, updated);
}
