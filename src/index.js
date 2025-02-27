class Script {
	constructor() {
		this.unfollowers = [];
		this.canQuery = true;
		this.nextPageHash = "";
		this.requestsCount = 0;
		this.followingCount = 0;
		this.currentPageCount = 0;
		this.estimatedStepValue = 0;
	}

	static sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	static printMessage = (message, type = "log") => {
		const styles = "padding: 0.5rem 0; font-size: 1rem; font-weight: 700;";
		console[type](`%c${message}`, styles);
	};

	async handleOutput(type) {
		const calculateETA = () => {
			const remaining = this.followingCount - this.currentPageCount;
			const steps = Math.floor(remaining / this.estimatedStepValue);
			const seconds = steps * 3 + Math.floor(steps / 5) * 15;
			const minutes = Math.floor(seconds / 60);
			return `${minutes} minute(s)`;
		};

		console.clear();

		if (type === "PROGRESS") {
			const progress = `${this.currentPageCount}/${this.followingCount}`;
			const percentage = Math.floor((this.currentPageCount / this.followingCount) * 100);
			const message = `Progress ${progress} (${percentage}% - ETA: ${calculateETA()})`;
			Script.printMessage(message, "warn");
		}

		if (type === "RATE_LIMIT") {
			const message = "RATE LIMIT: Waiting 15 seconds before requesting again...";
			Script.printMessage(message, "warn");
			await new Promise((res) => setTimeout(res, 15000));
		}

		if (type === "FINISH") {
			if (!this.unfollowers.length) {
				const message = "PROCESS FINISHED: Everyone followed you back! 😄";
				return Script.printMessage(message, "log");
			}

			const message = `PROCESS FINISHED: ${this.unfollowers.length} user(s) didn't follow you back. 🤬`;
			Script.printMessage(message, "group");

			this.unfollowers.forEach(({ username, isVerified }) => {
				const url = `https://www.instagram.com/${username}/`;
				const message = `${username}${isVerified ? " ☑️" : ""} - ${url}`;
				console.log(message);
			});

			console.groupEnd();
		}
	}

	async getCookie(cookieName) {
		const cookies = document.cookie.split(";").map((cookie) => cookie.trim());

		for (const cookie of cookies) {
			const [name, ...rest] = cookie.split("=");
			if (name === cookieName) return decodeURIComponent(rest.join("="));
		}

		throw new Error("ERROR: Cookie not found!");
	}

	async generateURL() {
		const dsUserId = await this.getCookie("ds_user_id");
		const variables = { id: dsUserId, first: "1000" };
		if (this.nextPageHash) variables.after = this.nextPageHash;

		const params = new URLSearchParams({
			query_hash: "3dec7e2c57367ef3da3d987d89f9dbc8",
			variables: JSON.stringify(variables)
		});

		return `https://www.instagram.com/graphql/query/?${params.toString()}`;
	}

	async startScript() {
		const checkVerifiedUsers = confirm("Do you want to check the verified users as well?");

		try {
			while (this.canQuery) {
				if (this.requestsCount && this.requestsCount % 5 === 0)
					await this.handleOutput("RATE_LIMIT");

				const url = await this.generateURL();
				const response = await fetch(url);
				const { data } = await response.json();
				const { edges, page_info: pageInfo, count } = data.user.edge_follow;

				edges.forEach((edge) => {
					const { username, is_verified, follows_viewer } = edge.node;
					if (follows_viewer) return;

					const unfollower = checkVerifiedUsers
						? { username, isVerified: is_verified }
						: { username };
					this.unfollowers.push(unfollower);
				});

				this.canQuery = pageInfo.has_next_page;
				this.nextPageHash = pageInfo.end_cursor;
				this.requestsCount++;
				this.followingCount = count;
				this.currentPageCount += edges.length;
				if (!this.estimatedStepValue) this.estimatedStepValue = edges.length;

				await this.handleOutput("PROGRESS");
				await Script.sleep(3000);
			}

			await this.handleOutput("FINISH");
		} catch (error) {
			const message = "ERROR: Something went wrong!";
			Script.printMessage(message, "error");
		}
	}
}

const script = new Script();
script.startScript();
