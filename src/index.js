import STYLES from "./styles.css";

const HOST_ID = "instagram-unfollowers";
const CLOSE_EVENT = "instagram-unfollowers:close";
const ORIGIN = "https://www.instagram.com";
// Public identifiers the instagram.com web client sends with its own API calls.
const APP_ID = "936619743392459";
const ASBD_ID = "129477";
const PAGE_SIZE = 50;
const MAX_PAGES = 2000;
const MAX_RETRIES = 3;
const REQUESTS_PER_BATCH = 15;
const BATCH_PAUSE_SECONDS = 10;

class ScanError extends Error {}

const numberFormat = new Intl.NumberFormat();
const formatCount = (count, noun) =>
	`${numberFormat.format(count)} ${noun}${count === 1 ? "" : "s"}`;

const getCookie = (name) =>
	document.cookie
		.split("; ")
		.find((cookie) => cookie.startsWith(`${name}=`))
		?.slice(name.length + 1);

const userKey = (user) => String(user.pk_id ?? user.pk);

const sleep = (ms, signal) =>
	new Promise((resolve, reject) => {
		if (signal.aborted) return reject(signal.reason);
		const onAbort = () => {
			clearTimeout(timer);
			reject(signal.reason);
		};
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve();
		}, ms);
		signal.addEventListener("abort", onAbort, { once: true });
	});

const element = (tag, attributes = {}, ...children) => {
	const node = document.createElement(tag);
	for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
	node.append(...children);
	return node;
};

const createPanel = (onCancel) => {
	document.getElementById(HOST_ID)?.dispatchEvent(new Event(CLOSE_EVENT));

	const host = element("div", { id: HOST_ID });
	const root = host.attachShadow({ mode: "open" });

	if ("adoptedStyleSheets" in root && typeof CSSStyleSheet.prototype.replaceSync === "function") {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(STYLES);
		root.adoptedStyleSheets = [sheet];
	} else {
		root.append(element("style", {}, STYLES));
	}

	const closeButton = element(
		"button",
		{ class: "close", type: "button", "aria-label": "Cancel and close" },
		"×"
	);
	const status = element("p", { class: "status" });
	const detail = element("p", { class: "detail" });
	const progress = element("div", { class: "progress", "aria-hidden": "true" });
	const list = element("ul", { hidden: "" });
	const copyButton = element("button", { class: "primary", type: "button" }, "Copy usernames");
	const footer = element("footer", { hidden: "" }, copyButton);
	const panel = element(
		"section",
		{ class: "panel", role: "dialog", "aria-labelledby": "title", "data-state": "running" },
		element("header", {}, element("h2", { id: "title" }, "Instagram Unfollowers"), closeButton),
		element(
			"div",
			{ class: "body" },
			element("div", { role: "status", "aria-live": "polite" }, status, detail),
			progress,
			list
		),
		footer
	);
	root.append(panel);

	let usernames = [];
	const isRunning = () => panel.dataset.state === "running";

	const close = () => {
		if (isRunning()) onCancel();
		document.removeEventListener("keydown", onKeyDown);
		host.remove();
	};
	const onKeyDown = (event) => {
		if (event.key === "Escape" && !isRunning()) close();
	};
	const settle = (state) => {
		panel.dataset.state = state;
		progress.hidden = true;
		closeButton.setAttribute("aria-label", "Close");
	};

	closeButton.addEventListener("click", close);
	host.addEventListener(CLOSE_EVENT, close);
	document.addEventListener("keydown", onKeyDown);
	copyButton.addEventListener("click", async () => {
		try {
			await navigator.clipboard.writeText(usernames.join("\n"));
			copyButton.textContent = "Copied";
		} catch {
			copyButton.textContent = "Copy failed. Select the list manually";
		}
		setTimeout(() => (copyButton.textContent = "Copy usernames"), 2000);
	});

	document.body.append(host);

	return {
		update(statusText, detailText = "") {
			status.textContent = statusText;
			detail.textContent = detailText;
		},
		fail(message) {
			settle("error");
			this.update(message, "Nothing was changed on your account.");
		},
		finish(nonFollowers, { following, followers }) {
			settle("done");
			usernames = nonFollowers.map((user) => user.username);
			const summary = `${numberFormat.format(following)} following · ${formatCount(followers, "follower")}`;

			if (!nonFollowers.length)
				return this.update("Everyone you follow follows you back.", summary);

			const verb = nonFollowers.length === 1 ? "doesn't" : "don't";
			this.update(
				`${formatCount(nonFollowers.length, "account")} ${verb} follow you back`,
				summary
			);
			list.replaceChildren(
				...nonFollowers.map(({ username, full_name: fullName, is_verified: isVerified }) => {
					const link = element(
						"a",
						{
							href: `${ORIGIN}/${encodeURIComponent(username)}/`,
							target: "_blank",
							rel: "noopener noreferrer"
						},
						username
					);
					if (isVerified)
						link.append(
							element(
								"span",
								{ class: "verified", role: "img", title: "Verified", "aria-label": "Verified" },
								"✓"
							)
						);
					return element(
						"li",
						{},
						link,
						fullName ? element("span", { class: "name" }, fullName) : ""
					);
				})
			);
			list.hidden = false;
			footer.hidden = false;
		}
	};
};

const createClient = (userId, signal, panel) => {
	const csrfToken = getCookie("csrftoken");
	const headers = {
		"X-IG-App-ID": APP_ID,
		"X-ASBD-ID": ASBD_ID,
		"X-Requested-With": "XMLHttpRequest"
	};
	if (csrfToken) headers["X-CSRFToken"] = csrfToken;

	let requests = 0;
	let restoreStatus = () => {};

	const countdown = async (seconds, message) => {
		for (let remaining = seconds; remaining > 0; remaining--) {
			panel.update(message, `Retrying in ${remaining}s. Keep this tab open.`);
			await sleep(1000, signal);
		}
		restoreStatus();
	};

	const fetchPage = async (kind, maxId) => {
		const url = new URL(`/api/v1/friendships/${userId}/${kind}/`, ORIGIN);
		url.searchParams.set("count", PAGE_SIZE);
		if (maxId) url.searchParams.set("max_id", maxId);

		for (let attempt = 1; ; attempt++) {
			let response;
			let data;
			try {
				response = await fetch(url, { credentials: "include", headers, signal });
				data = await response.json().catch(() => null);
			} catch (error) {
				if (signal.aborted) throw error;
				if (attempt > MAX_RETRIES)
					throw new ScanError("Couldn't reach Instagram. Check your connection and try again.");
				await countdown(5 * attempt, "Connection problem.");
				continue;
			}

			const message = String(data?.message ?? "");
			if (response.status >= 500) {
				if (attempt > MAX_RETRIES)
					throw new ScanError("Instagram is having problems right now. Try again later.");
				await countdown(5 * attempt, "Instagram didn't respond properly.");
				continue;
			}
			if (
				response.status === 429 ||
				/wait a few minutes|feedback_required|rate limit/i.test(message)
			) {
				if (attempt > MAX_RETRIES)
					throw new ScanError(
						"Instagram is limiting requests from your account. Wait about an hour, then try again."
					);
				await countdown(30 * 2 ** (attempt - 1), "Instagram is limiting requests.");
				continue;
			}
			if (response.status === 401 || /login_required/i.test(message)) {
				throw new ScanError(
					"Your Instagram session has expired. Reload the page, log in, and try again."
				);
			}
			if (data?.checkpoint_url || /checkpoint|challenge/i.test(message)) {
				throw new ScanError(
					"Instagram wants to verify your account. Complete the check on instagram.com, then try again."
				);
			}
			if (!response.ok || !Array.isArray(data?.users)) {
				throw new ScanError(
					`Instagram returned an unexpected response (HTTP ${response.status}). Try again later.`
				);
			}
			return data;
		}
	};

	const pace = async () => {
		requests++;
		if (requests % REQUESTS_PER_BATCH === 0) {
			await countdown(BATCH_PAUSE_SECONDS, "Pausing briefly to avoid rate limits.");
		} else {
			await sleep(800 + Math.random() * 800, signal);
		}
	};

	// Throws rather than returning a partial list: a truncated followers list would
	// report people who do follow you as non-followers.
	const fetchAll = async (kind, onProgress) => {
		const users = new Map();
		const cursors = new Set();
		let maxId;
		restoreStatus = () => onProgress(users.size);
		onProgress(0);

		for (let page = 0; page < MAX_PAGES; page++) {
			const data = await fetchPage(kind, maxId);
			for (const user of data.users) users.set(userKey(user), user);
			onProgress(users.size);

			maxId = data.next_max_id;
			if (!maxId || data.has_more === false) return [...users.values()];
			if (cursors.has(maxId))
				throw new ScanError(
					`Instagram returned the same page twice while loading your ${kind}. Try again later.`
				);
			cursors.add(maxId);
			await pace();
		}
		throw new ScanError(`Your ${kind} list is too long to load safely.`);
	};

	return { fetchAll };
};

const run = async () => {
	const controller = new AbortController();
	const panel = createPanel(() => controller.abort());

	try {
		if (location.origin !== ORIGIN)
			throw new ScanError("Open www.instagram.com, log in, and run the script there.");

		const userId = getCookie("ds_user_id");
		if (!/^\d+$/.test(userId ?? ""))
			throw new ScanError("Log in to Instagram, then run the script again.");

		const client = createClient(userId, controller.signal, panel);
		const following = await client.fetchAll("following", (count) =>
			panel.update(
				"Step 1 of 2: loading accounts you follow",
				`${formatCount(count, "account")} loaded. Keep this tab open.`
			)
		);
		const followers = await client.fetchAll("followers", (count) =>
			panel.update(
				"Step 2 of 2: loading your followers",
				`${formatCount(count, "follower")} loaded. Keep this tab open.`
			)
		);

		const followerKeys = new Set(followers.map(userKey));
		const nonFollowers = following.filter((user) => !followerKeys.has(userKey(user)));
		panel.finish(nonFollowers, { following: following.length, followers: followers.length });
	} catch (error) {
		if (controller.signal.aborted) return;
		if (!(error instanceof ScanError)) console.error(error);
		panel.fail(
			error instanceof ScanError
				? error.message
				: "Something went wrong. Reload the page and try again."
		);
	}
};

run();
