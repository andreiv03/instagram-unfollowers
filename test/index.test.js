import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { bundle } from "../scripts/bundle.js";

const readSnippet = async () => {
	const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
	const match = readme.match(
		/<!-- snippet:start -->\n```js\n([\s\S]*?)\n```\n<!-- snippet:end -->/
	);
	assert.ok(match, "README.md snippet not found or reformatted. Run `npm run build`.");
	return match[1];
};
const SOURCE = process.env.SNIPPET ? await readSnippet() : await bundle({ minify: false });
assert.ok(SOURCE.trim(), "script source is empty");

const windows = [];
afterEach(() => windows.splice(0).forEach((window) => window.close()));

const waitFor = async (condition, message) => {
	for (let i = 0; i < 1000 && !condition(); i++)
		await new Promise((resolve) => setTimeout(resolve, 1));
	assert.ok(condition(), message);
};

const users = (count, offset = 0) =>
	Array.from({ length: count }, (_, i) => ({
		pk: offset + i,
		pk_id: String(offset + i),
		username: `user${offset + i}`,
		full_name: `User ${offset + i}`,
		is_verified: false
	}));

const json = (body, status = 200) => ({ status, body });

const paginate = (lists) => (kind, maxId, count) => {
	const list = lists[kind];
	const start = Number(maxId ?? 0);
	const end = start + count;
	const more = end < list.length;
	return json({
		users: list.slice(start, end),
		has_more: more,
		...(more && { next_max_id: String(end) }),
		status: "ok"
	});
};

const setup = ({
	api,
	url = "https://www.instagram.com/",
	cookie = "ds_user_id=42; csrftoken=token"
}) => {
	const dom = new JSDOM("<!doctype html><body></body>", {
		url,
		runScripts: "outside-only",
		pretendToBeVisual: true
	});
	const { window } = dom;
	windows.push(window);
	for (const entry of cookie.split("; ").filter(Boolean)) window.document.cookie = entry;

	const requests = [];
	const delays = [];
	const realSetTimeout = window.setTimeout.bind(window);
	window.setTimeout = (fn, ms) => {
		delays.push(ms);
		return realSetTimeout(fn, 0);
	};
	window.fetch = async (input, init) => {
		if (init.signal?.aborted) throw new window.DOMException("Aborted", "AbortError");
		const requestUrl = new URL(String(input));
		const [, , , , userId, kind] = requestUrl.pathname.split("/");
		requests.push({ url: requestUrl, init, userId, kind });
		const { status, body } = api(
			kind,
			requestUrl.searchParams.get("max_id"),
			Number(requestUrl.searchParams.get("count")),
			requests.length
		);
		return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
	};
	Object.defineProperty(window.navigator, "clipboard", {
		value: { writeText: async (text) => (window.copied = text) }
	});

	window.eval(SOURCE);

	const shadow = () => window.document.getElementById("instagram-unfollowers")?.shadowRoot;
	const state = () => shadow()?.querySelector(".panel").dataset.state;
	const settled = async () => {
		await waitFor(() => state() !== "running", "scan did not finish");
		return shadow();
	};
	return { window, requests, delays, shadow, state, settled };
};

const text = (root, selector) => root.querySelector(selector).textContent;

test("lists accounts that don't follow back across multiple pages", async () => {
	const following = users(130);
	const missing = new Set([3, 50, 51, 99, 129]);
	following[50].is_verified = true;
	const followers = [
		...following.filter((u) => !missing.has(u.pk)).map(({ pk, username }) => ({ pk, username })),
		...users(80, 1000)
	];
	const app = setup({ api: paginate({ following, followers }) });

	const root = await app.settled();

	assert.equal(app.state(), "done");
	assert.match(
		root.querySelector("style").textContent,
		/^:host\{all:initial\}\.panel\{/,
		"styles.css is not inlined"
	);
	assert.equal(text(root, ".status"), "5 accounts don't follow you back");
	assert.equal(text(root, ".detail"), "130 following · 205 followers");
	const links = [...root.querySelectorAll("li a")];
	assert.deepEqual(
		links.map((a) => a.firstChild.textContent),
		["user3", "user50", "user51", "user99", "user129"]
	);
	assert.equal(links[0].href, "https://www.instagram.com/user3/");
	assert.equal(links[0].rel, "noopener noreferrer");
	assert.equal(links[1].querySelector(".verified").getAttribute("aria-label"), "Verified");
	assert.equal(links[0].querySelector(".verified"), null);
	assert.equal(root.querySelector("li .name").textContent, "User 3");

	root.querySelector(".primary").click();
	await new Promise((resolve) => setTimeout(resolve, 5));
	assert.equal(app.window.copied, "user3\nuser50\nuser51\nuser99\nuser129");
});

test("sends authenticated same-origin requests for the logged-in user", async () => {
	const app = setup({ api: paginate({ following: users(1), followers: users(1) }) });
	await app.settled();

	assert.deepEqual(
		app.requests.map((r) => r.kind),
		["following", "followers"]
	);
	for (const { url, init, userId } of app.requests) {
		assert.equal(url.origin, "https://www.instagram.com");
		assert.equal(userId, "42");
		assert.equal(init.credentials, "include");
		assert.equal(init.headers["X-IG-App-ID"], "936619743392459");
		assert.equal(init.headers["X-CSRFToken"], "token");
	}
});

test("reports when everyone follows back", async () => {
	const list = users(3);
	const app = setup({ api: paginate({ following: list, followers: list }) });
	const root = await app.settled();

	assert.equal(text(root, ".status"), "Everyone you follow follows you back.");
	assert.equal(text(root, ".detail"), "3 following · 3 followers");
	assert.ok(root.querySelector("ul").hidden);
	assert.ok(root.querySelector("footer").hidden);
});

test("renders untrusted profile data as text", async () => {
	const evil = {
		pk: 1,
		username: '"><img src=x onerror=alert(1)>',
		full_name: "<script>alert(1)</script>",
		is_verified: false
	};
	const app = setup({ api: paginate({ following: [evil], followers: [] }) });
	const root = await app.settled();

	assert.equal(root.querySelector("img, script"), null);
	assert.equal(root.querySelector("li a").textContent, evil.username);
	assert.equal(root.querySelector("li .name").textContent, evil.full_name);
	assert.equal(
		new URL(root.querySelector("li a").href).pathname,
		`/${encodeURIComponent(evil.username)}/`
	);
});

test("waits and retries when rate limited", async () => {
	const pages = paginate({ following: users(2), followers: [] });
	const app = setup({
		api: (kind, maxId, count, n) =>
			n === 1
				? json({ message: "Please wait a few minutes", status: "fail" }, 429)
				: pages(kind, maxId, count)
	});
	const root = await app.settled();

	assert.equal(app.state(), "done");
	assert.equal(app.requests.length, 3);
	assert.equal(app.delays.filter((ms) => ms === 1000).length, 30);
	assert.equal(text(root, ".status"), "2 accounts don't follow you back");
});

test("retries server errors", async () => {
	const pages = paginate({ following: users(1), followers: [] });
	const app = setup({
		api: (kind, maxId, count, n) => (n === 1 ? json("<html>", 503) : pages(kind, maxId, count))
	});
	await app.settled();

	assert.equal(app.state(), "done");
});

test("gives up after repeated rate limits without showing partial results", async () => {
	const app = setup({
		api: () => json({ message: "Please wait a few minutes", status: "fail" }, 429)
	});
	const root = await app.settled();

	assert.equal(app.state(), "error");
	assert.equal(app.requests.length, 4);
	assert.match(text(root, ".status"), /limiting requests/);
	assert.ok(root.querySelector("ul").hidden);
});

test("fails instead of diffing against a partial followers list", async () => {
	const pages = paginate({ following: users(10), followers: users(200) });
	const app = setup({
		api: (kind, maxId, count) =>
			kind === "followers" && maxId === "100"
				? json({ message: "login_required", status: "fail" }, 401)
				: pages(kind, maxId, count)
	});
	const root = await app.settled();

	assert.equal(app.state(), "error");
	assert.match(text(root, ".status"), /session has expired/);
	assert.equal(text(root, ".detail"), "Nothing was changed on your account.");
	assert.ok(root.querySelector("ul").hidden);
});

test("explains checkpoint challenges", async () => {
	const app = setup({
		api: () =>
			json({ message: "checkpoint_required", checkpoint_url: "/challenge/", status: "fail" }, 400)
	});
	const root = await app.settled();

	assert.match(text(root, ".status"), /verify your account/);
});

test("rejects malformed responses", async () => {
	const app = setup({ api: () => json({ status: "ok" }) });
	const root = await app.settled();

	assert.match(text(root, ".status"), /unexpected response \(HTTP 200\)/);
});

test("stops when Instagram repeats a page", async () => {
	const app = setup({
		api: () => json({ users: users(1), has_more: true, next_max_id: "same", status: "ok" })
	});
	const root = await app.settled();

	assert.equal(app.requests.length, 2);
	assert.match(text(root, ".status"), /same page twice/);
});

test("requires the user to be logged in", async () => {
	const app = setup({ api: () => assert.fail("should not fetch"), cookie: "" });
	const root = await app.settled();

	assert.match(text(root, ".status"), /Log in to Instagram/);
});

test("refuses to run outside instagram.com", async () => {
	const app = setup({ api: () => assert.fail("should not fetch"), url: "https://example.com/" });
	const root = await app.settled();

	assert.match(text(root, ".status"), /Open www\.instagram\.com/);
});

test("closing the panel cancels the scan", async () => {
	const app = setup({
		api: () =>
			json({ users: users(1), has_more: true, next_max_id: String(Math.random()), status: "ok" })
	});
	await waitFor(() => app.requests.length >= 3, "scan did not paginate");

	app.shadow().querySelector(".close").click();
	const count = app.requests.length;
	await new Promise((resolve) => setTimeout(resolve, 50));

	assert.equal(app.shadow(), undefined);
	assert.equal(app.requests.length, count);
});

test("running the script again replaces the previous panel", async () => {
	const list = users(1);
	const app = setup({ api: paginate({ following: list, followers: list }) });
	await app.settled();
	app.window.eval(SOURCE);
	await app.settled();

	assert.equal(app.window.document.querySelectorAll("#instagram-unfollowers").length, 1);
});
