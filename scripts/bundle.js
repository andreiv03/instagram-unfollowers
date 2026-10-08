import { readFile } from "node:fs/promises";
import { build, transform } from "esbuild";

const inlineMinifiedCss = {
	name: "inline-minified-css",
	setup(builder) {
		builder.onLoad({ filter: /\.css$/ }, async ({ path }) => {
			const { code } = await transform(await readFile(path, "utf8"), {
				loader: "css",
				minify: true
			});
			return { contents: code.trim(), loader: "text" };
		});
	}
};

export const bundle = async ({ minify = true } = {}) => {
	const { outputFiles } = await build({
		entryPoints: [new URL("../src/index.js", import.meta.url).pathname],
		bundle: true,
		format: "iife",
		target: "es2022",
		minify,
		legalComments: "none",
		write: false,
		logLevel: "error",
		plugins: [inlineMinifiedCss]
	});
	return outputFiles[0].text.trim();
};
