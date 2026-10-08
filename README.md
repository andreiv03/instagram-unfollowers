# Instagram Unfollowers

Find the Instagram accounts you follow that don't follow you back. The script runs in your browser on instagram.com: no extension, no third-party server, no password.

## Usage

1. Open [instagram.com](https://www.instagram.com) on a desktop browser and log in.
2. Open the developer console: `Cmd + Option + J` on macOS, `Ctrl + Shift + J` on Windows and Linux (`F12` also works).
3. Paste the script below and press **Enter**. If the browser blocks pasting, type `allow pasting` first, then paste again. Don't paste the files in `src/`: they need to be built first.

<!-- snippet:start -->
```js
(()=>{var k=':host{all:initial}.panel{--bg: #fff;--fg: #000;--muted: #737373;--border: #dbdbdb;--accent: #0095f6;--button: #0064e0;--danger: #c62828;position:fixed;top:16px;right:16px;z-index:2147483647;display:flex;flex-direction:column;box-sizing:border-box;width:min(380px,calc(100vw - 32px));max-height:calc(100vh - 32px);font:14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:12px;box-shadow:0 8px 32px #0003}@media (prefers-color-scheme: dark){.panel{--bg: #262626;--fg: #f5f5f5;--muted: #a8a8a8;--border: #363636;--accent: #4cb5f9;--danger: #ff7b82}}header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)}h2{margin:0;font-size:16px;font-weight:600}button{font:inherit;cursor:pointer;border:0;border-radius:8px}button:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.close{width:32px;height:32px;font-size:22px;line-height:1;color:var(--fg);background:none}.body{padding:16px;overflow-y:auto}.status{margin:0;font-weight:600}.detail{margin:4px 0 0;color:var(--muted)}[data-state=error] .status{color:var(--danger)}.progress{height:4px;margin-top:12px;overflow:hidden;border-radius:2px;background:var(--border)}.progress:after{content:"";display:block;width:40%;height:100%;background:var(--accent);animation:slide 1.2s ease-in-out infinite}@keyframes slide{0%{transform:translate(-100%)}to{transform:translate(250%)}}@media (prefers-reduced-motion: reduce){.progress:after{width:100%;animation:none;opacity:.5}}ul{margin:12px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:12px}li{padding-top:12px;border-top:1px solid var(--border)}li a{color:var(--fg);font-weight:600;text-decoration:none}li a:hover{text-decoration:underline}.verified{margin-left:4px;color:var(--accent)}.name{display:block;color:var(--muted)}footer{padding:12px 16px;border-top:1px solid var(--border)}.primary{width:100%;padding:8px 16px;font-weight:600;color:#fff;background:var(--button)}[hidden]{display:none!important}';var T="instagram-unfollowers",R="instagram-unfollowers:close",I="https://www.instagram.com",z="936619743392459",H="129477",K=50,M=2e3,C=3,O=15,U=10,l=class extends Error{},P=new Intl.NumberFormat,S=(o,e)=>`${P.format(o)} ${e}${o===1?"":"s"}`,D=o=>document.cookie.split("; ").find(e=>e.startsWith(`${o}=`))?.slice(o.length+1),E=o=>String(o.pk_id??o.pk),L=(o,e)=>new Promise((n,r)=>{if(e.aborted)return r(e.reason);let c=()=>{clearTimeout(u),r(e.reason)},u=setTimeout(()=>{e.removeEventListener("abort",c),n()},o);e.addEventListener("abort",c,{once:!0})}),a=(o,e={},...n)=>{let r=document.createElement(o);for(let[c,u]of Object.entries(e))r.setAttribute(c,u);return r.append(...n),r},G=o=>{document.getElementById(T)?.dispatchEvent(new Event(R));let e=a("div",{id:T}),n=e.attachShadow({mode:"open"});if("adoptedStyleSheets"in n&&typeof CSSStyleSheet.prototype.replaceSync=="function"){let t=new CSSStyleSheet;t.replaceSync(k),n.adoptedStyleSheets=[t]}else n.append(a("style",{},k));let r=a("button",{class:"close",type:"button","aria-label":"Cancel and close"},"\xD7"),c=a("p",{class:"status"}),u=a("p",{class:"detail"}),w=a("div",{class:"progress","aria-hidden":"true"}),g=a("ul",{hidden:""}),d=a("button",{class:"primary",type:"button"},"Copy usernames"),y=a("footer",{hidden:""},d),x=a("section",{class:"panel",role:"dialog","aria-labelledby":"title","data-state":"running"},a("header",{},a("h2",{id:"title"},"Instagram Unfollowers"),r),a("div",{class:"body"},a("div",{role:"status","aria-live":"polite"},c,u),w,g),y);n.append(x);let m=[],f=()=>x.dataset.state==="running",s=()=>{f()&&o(),document.removeEventListener("keydown",p),e.remove()},p=t=>{t.key==="Escape"&&!f()&&s()},i=t=>{x.dataset.state=t,w.hidden=!0,r.setAttribute("aria-label","Close")};return r.addEventListener("click",s),e.addEventListener(R,s),document.addEventListener("keydown",p),d.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(m.join(`
`)),d.textContent="Copied"}catch{d.textContent="Copy failed. Select the list manually"}setTimeout(()=>d.textContent="Copy usernames",2e3)}),document.body.append(e),{update(t,h=""){c.textContent=t,u.textContent=h},fail(t){i("error"),this.update(t,"Nothing was changed on your account.")},finish(t,{following:h,followers:b}){i("done"),m=t.map(v=>v.username);let _=`${P.format(h)} following \xB7 ${S(b,"follower")}`;if(!t.length)return this.update("Everyone you follow follows you back.",_);let B=t.length===1?"doesn't":"don't";this.update(`${S(t.length,"account")} ${B} follow you back`,_),g.replaceChildren(...t.map(({username:v,full_name:A,is_verified:q})=>{let $=a("a",{href:`${I}/${encodeURIComponent(v)}/`,target:"_blank",rel:"noopener noreferrer"},v);return q&&$.append(a("span",{class:"verified",role:"img",title:"Verified","aria-label":"Verified"},"\u2713")),a("li",{},$,A?a("span",{class:"name"},A):"")})),g.hidden=!1,y.hidden=!1}}},N=(o,e,n)=>{let r=D("csrftoken"),c={"X-IG-App-ID":z,"X-ASBD-ID":H,"X-Requested-With":"XMLHttpRequest"};r&&(c["X-CSRFToken"]=r);let u=0,w=()=>{},g=async(m,f)=>{for(let s=m;s>0;s--)n.update(f,`Retrying in ${s}s. Keep this tab open.`),await L(1e3,e);w()},d=async(m,f)=>{let s=new URL(`/api/v1/friendships/${o}/${m}/`,I);s.searchParams.set("count",K),f&&s.searchParams.set("max_id",f);for(let p=1;;p++){let i,t;try{i=await fetch(s,{credentials:"include",headers:c,signal:e}),t=await i.json().catch(()=>null)}catch(b){if(e.aborted)throw b;if(p>C)throw new l("Couldn't reach Instagram. Check your connection and try again.");await g(5*p,"Connection problem.");continue}let h=String(t?.message??"");if(i.status>=500){if(p>C)throw new l("Instagram is having problems right now. Try again later.");await g(5*p,"Instagram didn't respond properly.");continue}if(i.status===429||/wait a few minutes|feedback_required|rate limit/i.test(h)){if(p>C)throw new l("Instagram is limiting requests from your account. Wait about an hour, then try again.");await g(30*2**(p-1),"Instagram is limiting requests.");continue}if(i.status===401||/login_required/i.test(h))throw new l("Your Instagram session has expired. Reload the page, log in, and try again.");if(t?.checkpoint_url||/checkpoint|challenge/i.test(h))throw new l("Instagram wants to verify your account. Complete the check on instagram.com, then try again.");if(!i.ok||!Array.isArray(t?.users))throw new l(`Instagram returned an unexpected response (HTTP ${i.status}). Try again later.`);return t}},y=async()=>{u++,u%O===0?await g(U,"Pausing briefly to avoid rate limits."):await L(800+Math.random()*800,e)};return{fetchAll:async(m,f)=>{let s=new Map,p=new Set,i;w=()=>f(s.size),f(0);for(let t=0;t<M;t++){let h=await d(m,i);for(let b of h.users)s.set(E(b),b);if(f(s.size),i=h.next_max_id,!i||h.has_more===!1)return[...s.values()];if(p.has(i))throw new l(`Instagram returned the same page twice while loading your ${m}. Try again later.`);p.add(i),await y()}throw new l(`Your ${m} list is too long to load safely.`)}}},j=async()=>{let o=new AbortController,e=G(()=>o.abort());try{if(location.origin!==I)throw new l("Open www.instagram.com, log in, and run the script there.");let n=D("ds_user_id");if(!/^\d+$/.test(n??""))throw new l("Log in to Instagram, then run the script again.");let r=N(n,o.signal,e),c=await r.fetchAll("following",d=>e.update("Step 1 of 2: loading accounts you follow",`${S(d,"account")} loaded. Keep this tab open.`)),u=await r.fetchAll("followers",d=>e.update("Step 2 of 2: loading your followers",`${S(d,"follower")} loaded. Keep this tab open.`)),w=new Set(u.map(E)),g=c.filter(d=>!w.has(E(d)));e.finish(g,{following:c.length,followers:u.length})}catch(n){if(o.signal.aborted)return;n instanceof l||console.error(n),e.fail(n instanceof l?n.message:"Something went wrong. Reload the page and try again.")}};j();})();
```
<!-- snippet:end -->

4. A panel opens in the top-right corner and shows progress. Keep the tab open until it finishes.
5. The panel lists every account that doesn't follow you back, with a link to each profile. **Copy usernames** copies the list.

## How it works

- Loads your **Following** and **Followers** lists through the same endpoints instagram.com uses, then compares them in the browser.
- Spaces requests about a second apart, pauses every 15 requests, and backs off for 30, 60, then 120 seconds if Instagram rate-limits the session.
- If either list can't be loaded completely, the scan stops with an error instead of showing results. A partial followers list would list people who do follow you.

## Security and privacy

- **Read-only.** The script never follows, unfollows or changes anything on your account.
- **Talks only to `www.instagram.com`**, using the session you're already logged in with. Nothing is sent anywhere else or stored.
- **Don't paste code you haven't checked.** The snippet is built from [`src/index.js`](src/index.js) and [`src/styles.css`](src/styles.css); CI fails if it ever differs from the source.

## Limitations

- The script relies on Instagram's private web API, which can change without notice.
- Large accounts take several minutes, mostly because Instagram returns followers in small pages.
- Running it repeatedly can trigger Instagram's rate limits. If that happens, wait about an hour.
- Automated access may conflict with Instagram's Terms of Use. Use it at your own risk.

## Development

Requires Node.js 20 or later.

```sh
npm ci
npm test        # runs the test suite against the source and against the README snippet
npm run build   # bundles src/ (script + inlined CSS) into the README snippet
npm run format  # formats the code with Prettier
npm run check   # verifies the README snippet and formatting, as CI does
```

Issues and pull requests are welcome. Run `npm test` and `npm run build` before opening a pull request.

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE).
