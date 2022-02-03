# Instagram Unfollowers

The easiest way to check who hasn't followed you back on Instagram is to do it manually, keeping track of the exact number of followers. If you notice your followers count goes down, you can investigate the "Following" lists of those specific users to verify whether or not they're still following you.

This is obviously very time-consuming and impractical work — especially when you have a lot of followers who fluctuate regularly. From now you can use this script to check who hasn't followed you back!

## Usage

1. Sign in to your Instagram account on your browser.
2. Open browser's console / devtools by pressing F12 on your keyboard.
3. Copy this script:

```js
class Output { constructor() { this.styles = ` padding: 0.5rem 0; font-size: 1rem; font-weight: 700; `; } handleProgressOutput(total, currentPage) { console.clear(); console.log(`%cProgress ${currentPage}/${total} (${parseInt(currentPage / total * 100)}%)`, this.styles); } async handleRateLimitOutput(count) { if (!count || count % 5 !== 0) return; console.clear(); console.warn("%cRATE LIMIT - Waiting 10 seconds before requesting again...", this.styles); await sleep(10000); } handleProcessFinishOutput(unfollowers, length) { console.clear(); if (!length) return console.log(`%cPROCESS FINISHED - Everyone followed you back! 😄`, this.styles); console.group(`%cPROCESS FINISHED - ${length} ${length === 1 ? "user" : "users"} didn't follow you back. 🤬`, this.styles); unfollowers.forEach(unfollower => console.log(`${unfollower.username} ${unfollower.isVerified ? "☑️" : ""}`)); console.groupEnd(); } } class Script extends Output { constructor(checkVerifiedUsers) { super(); this.checkVerifiedUsers = checkVerifiedUsers; this.unfollowers = []; this.canQuery = false; this.nextPageHash = ""; this.requestsCount = 0; this.followingCount = { total: 0, currentPage: 0 }; } getCookie(cookieName) { return new Promise((resolve, reject) => { const cookies = document.cookie.split(";"); for (const cookie of cookies) { const pair = cookie.split("="); if (pair[0].trim() === cookieName) resolve(decodeURIComponent(pair[1])); } reject(""); }); } createURLParamsString(params) { return Object.keys(params).map(key => { const value = params[key]; if (typeof value === "object") return `${key}=${JSON.stringify(value)}`; else return `${key}=${value}`; }).join("&"); } async generateURL() { const params = { query_hash: "3dec7e2c57367ef3da3d987d89f9dbc8", variables: { id: await this.getCookie("ds_user_id"), first: "50" } }; if (this.nextPageHash) params.variables.after = this.nextPageHash; return `https://www.instagram.com/graphql/query/?${this.createURLParamsString(params)}`; } async startScript() { try { do { await this.handleRateLimitOutput(this.requestsCount); const url = await this.generateURL(); const { data } = await fetch(url).then(res => res.json()); data.user.edge_follow.edges.forEach(edge => { if (checkVerifiedUsers && !edge.node.follows_viewer) this.unfollowers.push({ username: edge.node.username, isVerified: edge.node.is_verified }); else if (!checkVerifiedUsers && !edge.node.is_verified && !edge.node.follows_viewer) this.unfollowers.push({ username: edge.node.username }); }); this.canQuery = data.user.edge_follow.page_info.has_next_page; this.nextPageHash = data.user.edge_follow.page_info.end_cursor; this.requestsCount++; if (!this.followingCount.total) this.followingCount.total = data.user.edge_follow.count; this.followingCount.currentPage += data.user.edge_follow.edges.length; this.handleProgressOutput(this.followingCount.total, this.followingCount.currentPage); await sleep(1500); } while (this.canQuery); this.handleProcessFinishOutput(this.unfollowers, this.unfollowers.length); } catch (error) { return console.error(`Something went wrong!\n${error}`); } } } const sleep = ms => new Promise(resolve => setTimeout(resolve, ms)); const checkVerifiedUsers = confirm("Do you want to check the verified users as well?"); const script = new Script(checkVerifiedUsers); script.startScript();
```

4. Paste the script on to the console and wait for the process to finish.

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated. If you have a suggestion that would make this better, please fork the repository and create a pull request. You can also simply open an issue with the tag "enhancement".

Don't forget to give the project a star! Thanks! 😄

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.
