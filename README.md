# Instagram Unfollowers

The easiest way to check who hasn't followed you back on Instagram is to do it manually, keeping track of the exact number of followers. If you notice your followers count goes down, you can investigate the "Following" lists of those specific users to verify whether or not they're still following you.

This is obviously very time-consuming and impractical work — especially when you have a lot of followers who fluctuate regularly. From now you can use this script to check who hasn't followed you back!

## Usage

1. Sign in to your Instagram account on your browser.
2. Open browser's console / devtools by pressing F12 on your keyboard.
3. Copy this script:

```js
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)); const styles = ` padding: 0.5rem 0; font-size: 1rem; font-weight: 700; `; async function handleOutput(type, data) { switch (type) { case "progress": { console.clear(); console.warn(`%cProgress ${data.currentPage}/${data.followingCount} (${parseInt(data.currentPage / data.followingCount * 100)}%)`, styles); break; } case "rateLimit": { if (data.requestsCount === 0 || data.requestsCount % 5 !== 0) return; console.clear(); console.warn("%cRATE LIMIT - Waiting 10 seconds before requesting again...", styles); await sleep(10000); break; } case "finish": { console.clear(); if (data.unfollowers.length === 0) return console.warn(`%cPROCESS FINISHED - Everyone followed you back! 😄`, styles); console.group(`%cPROCESS FINISHED - ${data.unfollowers.length} ${data.unfollowers.length === 1 ? "user" : "users"} didn't follow you back. 🤬`, styles); data.unfollowers.forEach(unfollower => console.log(`${unfollower.username}${unfollower.isVerified ? " ☑️" : ""} - https://www.instagram.com/${unfollower.username}/`)); console.groupEnd(); } } } class Script { constructor(checkVerifiedUsers) { this.checkVerifiedUsers = checkVerifiedUsers; this.unfollowers = []; this.canQuery = false; this.nextPageHash = ""; this.requestsCount = 0; this.followingCount = 0; this.currentPage = 0; } getCookie(cookieName) { return new Promise((resolve, reject) => { const cookies = document.cookie.split(";"); for (const cookie of cookies) { const pair = cookie.split("="); if (pair[0].trim() === cookieName) resolve(decodeURIComponent(pair[1])); } reject("Cookie not found!"); }); } createURLParamsString(params) { return Object.keys(params).map(key => { const value = params[key]; if (typeof value === "object") return `${key}=${JSON.stringify(value)}`; else return `${key}=${value}`; }).join("&"); } async generateURL() { const params = { query_hash: "3dec7e2c57367ef3da3d987d89f9dbc8", variables: { id: await this.getCookie("ds_user_id"), first: "50" } }; if (this.nextPageHash) params.variables.after = this.nextPageHash; return `https://www.instagram.com/graphql/query/?${this.createURLParamsString(params)}`; } async startScript() { try { do { await handleOutput("rateLimit", { requestsCount: this.requestsCount }); const url = await this.generateURL(); const { data } = await fetch(url).then(res => res.json()); if (checkVerifiedUsers) { data.user.edge_follow.edges.forEach(edge => { if (!edge.node.follows_viewer) this.unfollowers.push({ username: edge.node.username, isVerified: edge.node.is_verified }); }); } else { data.user.edge_follow.edges.forEach(edge => { if (!edge.node.is_verified && !edge.node.follows_viewer) this.unfollowers.push({ username: edge.node.username }); }); } this.canQuery = data.user.edge_follow.page_info.has_next_page; this.nextPageHash = data.user.edge_follow.page_info.end_cursor; this.requestsCount++; this.followingCount = data.user.edge_follow.count; this.currentPage += data.user.edge_follow.edges.length; handleOutput("progress", { currentPage: this.currentPage, followingCount: this.followingCount }); await sleep(2000); } while (this.canQuery); handleOutput("finish", { unfollowers: this.unfollowers }); } catch (error) { return console.error(`Something went wrong!\n${error}`); } } }; const checkVerifiedUsers = confirm("Do you want to check the verified users as well?"); const script = new Script(checkVerifiedUsers); script.startScript();
```

4. Paste the script on to the console and wait for the process to finish. (it may take some time, depending on how many users you're following)

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated. If you have a suggestion that would make this better, please fork the repository and create a pull request. You can also simply open an issue with the tag "enhancement".

Don't forget to give the project a star! Thanks! 😄

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.
