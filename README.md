# Instagram Unfollowers

Manually tracking Instagram followers to identify users who haven’t followed you back can be tedious and time-consuming. If your follower count decreases, you typically need to check individual **Following** lists to determine whether specific users are still following you.

This process becomes increasingly impractical as your follower count fluctuates. To streamline this task, this script provides an automated solution, allowing you to efficiently identify users who haven't followed you back.

## 📌 Usage

1. **Log in** to your Instagram account on your browser.  
2. **Open Developer Tools** (`F12` or `Ctrl + Shift + I`) and go to the **Console** tab.  
3. **Copy & Paste** the following script into the console and press **Enter**:  

```js
class Script{constructor(){this.unfollowers=[],this.canQuery=!0,this.nextPageHash="",this.requestsCount=0,this.followingCount=0,this.currentPageCount=0,this.estimatedStepValue=0}static sleep=t=>new Promise(e=>setTimeout(e,t));static printMessage=(t,e="log")=>{console[e](`%c${t}`,"padding: 0.5rem 0; font-size: 1rem; font-weight: 700;")};async handleOutput(t){if(console.clear(),"PROGRESS"===t){let e=`${this.currentPageCount}/${this.followingCount}`,s=Math.floor(this.currentPageCount/this.followingCount*100),i=`Progress ${e} (${s}% - ETA: ${(()=>{let t=this.followingCount-this.currentPageCount,e=Math.floor(t/this.estimatedStepValue);return`${Math.floor((3*e+15*Math.floor(e/5))/60)} minute(s)`})()})`;Script.printMessage(i,"warn")}if("RATE_LIMIT"===t&&(Script.printMessage("RATE LIMIT: Waiting 15 seconds before requesting again...","warn"),await new Promise(t=>setTimeout(t,15e3))),"FINISH"===t){if(!this.unfollowers.length)return Script.printMessage("PROCESS FINISHED: Everyone followed you back! \uD83D\uDE04","log");let r=`PROCESS FINISHED: ${this.unfollowers.length} user(s) didn't follow you back. 🤬`;Script.printMessage(r,"group"),this.unfollowers.forEach(({username:t,isVerified:e})=>{let s=`https://www.instagram.com/${t}/`,i=`${t}${e?" ☑️":""} - ${s}`;console.log(i)}),console.groupEnd()}}async getCookie(t){let e=document.cookie.split(";").map(t=>t.trim());for(let s of e){let[i,...r]=s.split("=");if(i===t)return decodeURIComponent(r.join("="))}throw Error("ERROR: Cookie not found!")}async generateURL(){let t=await this.getCookie("ds_user_id"),e={id:t,first:"1000"};this.nextPageHash&&(e.after=this.nextPageHash);let s=new URLSearchParams({query_hash:"3dec7e2c57367ef3da3d987d89f9dbc8",variables:JSON.stringify(e)});return`https://www.instagram.com/graphql/query/?${s.toString()}`}async startScript(){let t=confirm("Do you want to check the verified users as well?");try{for(;this.canQuery;){this.requestsCount&&this.requestsCount%5==0&&await this.handleOutput("RATE_LIMIT");let e=await this.generateURL(),s=await fetch(e),{data:i}=await s.json(),{edges:r,page_info:n,count:o}=i.user.edge_follow;r.forEach(e=>{let{username:s,is_verified:i,follows_viewer:r}=e.node;if(r)return;let n=t?{username:s,isVerified:i}:{username:s};this.unfollowers.push(n)}),this.canQuery=n.has_next_page,this.nextPageHash=n.end_cursor,this.requestsCount++,this.followingCount=o,this.currentPageCount+=r.length,this.estimatedStepValue||(this.estimatedStepValue=r.length),await this.handleOutput("PROGRESS"),await Script.sleep(3e3)}await this.handleOutput("FINISH")}catch(a){Script.printMessage("ERROR: Something went wrong!","error")}}}const script=new Script;script.startScript();
```

4. Wait for the process to complete — it may take a few minutes depending on how many users you're following.

## 🤝 Contributing

Contributions are welcome! If you'd like to enhance the project, follow these steps:

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature-branch`)
3. **Commit** your changes (`git commit -m "feat: add new feature"`)
4. **Push** your changes (`git push origin feature-branch`)
5. Open a **Pull Request** 🚀

For suggestions or bug reports, feel free to open an issue with the appropriate label.

⭐ **If you find this project useful, consider giving it a star!** ⭐

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.
