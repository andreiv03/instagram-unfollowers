# Instagram Unfollowers

Manually tracking Instagram followers to identify users who haven’t followed you back can be tedious and time-consuming. If your follower count decreases, you typically need to check individual **Following** lists to determine whether specific users are still following you.

This process becomes increasingly impractical as your follower count fluctuates. To streamline this task, this script provides an automated solution, allowing you to efficiently identify users who haven't followed you back.

## 📌 Usage

1. **Log in** to your Instagram account on your browser.  
2. **Open Developer Tools** (`F12` or `Ctrl + Shift + I`) and go to the **Console** tab.  
3. **Copy & Paste** the following script into the console and press **Enter**:  

```js
class Script{constructor(){this.unfollowers=[],this.canQuery=!0,this.nextPageHash="",this.requestsCount=0,this.followingCount=0,this.currentPageCount=0,this.estimatedStepValue=0}static sleep=ms=>new Promise((resolve=>setTimeout(resolve,ms)));static printMessage=(message,type="log",hasStyles=!0)=>{console[type](`%c${message}`,hasStyles?"padding: 0.5rem 0; font-size: 1rem; font-weight: 700;":"")};async handleOutput(type){const calculateETA=()=>{const remaining=this.followingCount-this.currentPageCount,steps=Math.floor(remaining/this.estimatedStepValue),seconds=3*steps+15*Math.floor(steps/5);return`${Math.floor(seconds/60)} minute(s)`};if(console.clear(),"PROGRESS"===type){const message=`Progress ${`${this.currentPageCount}/${this.followingCount}`} (${Math.floor(this.currentPageCount/this.followingCount*100)}% - ETA: ${calculateETA()})`;Script.printMessage(message,"warn")}if("RATE_LIMIT"===type){const message="RATE LIMIT: Waiting 15 seconds before requesting again...";Script.printMessage(message,"warn"),await new Promise((res=>setTimeout(res,15e3)))}if("FINISH"===type){if(!this.unfollowers.length){const message="PROCESS FINISHED: Everyone followed you back! 😄";return Script.printMessage(message,"log")}const message=`PROCESS FINISHED: ${this.unfollowers.length} user(s) didn't follow you back. 🤬`;Script.printMessage(message,"group"),this.unfollowers.forEach((({username:username,isVerified:isVerified})=>{const message=`${username}${isVerified?" ☑️":""} - ${`https://www.instagram.com/${usernaame}/`}`;Script.printMessage(message,"log",!1)})),console.groupEnd()}}async getCookie(cookieName){const cookies=document.cookie.split(";").map((cookie=>cookie.trim()));for(const cookie of cookies){const[name,...rest]=cookie.split("=");if(name===cookieName)return decodeURIComponent(rest.join("="))}throw new Error("ERROR: Cookie not found!")}async generateURL(){const variables={id:await this.getCookie("ds_user_id"),first:"1000"};this.nextPageHash&&(variables.after=this.nextPageHash);return`https://www.instagram.com/graphql/query/?${new URLSearchParams({query_hash:"3dec7e2c57367ef3da3d987d89f9dbc8",variables:JSON.stringify(variables)}).toString()}`}async startScript(){const checkVerifiedUsers=confirm("Do you want to check the verified users as well?");try{for(;this.canQuery;){this.requestsCount&&this.requestsCount%5==0&&await this.handleOutput("RATE_LIMIT");const url=await this.generateURL(),response=await fetch(url),{data:data}=await response.json(),{edges:edges,page_info:pageInfo,count:count}=data.user.edge_follow;edges.forEach((edge=>{const{username:username,is_verified:is_verified,follows_viewer:follows_viewer}=edge.node;if(follows_viewer)return;const unfollower=checkVerifiedUsers?{username:username,isVerified:is_verified}:{username:username};this.unfollowers.push(unfollower)})),this.canQuery=pageInfo.has_next_page,this.nextPageHash=pageInfo.end_cursor,this.requestsCount++,this.followingCount=count,this.currentPageCount+=edges.length,this.estimatedStepValue||(this.estimatedStepValue=edges.length),await this.handleOutput("PROGRESS"),await Script.sleep(3e3)}await this.handleOutput("FINISH")}catch(error){const message="ERROR: Something went wrong!";Script.printMessage(message,"error")}}}const script=new Script;script.startScript();
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

Distributed under the **MIT License**. See `LICENSE.txt` for details.
