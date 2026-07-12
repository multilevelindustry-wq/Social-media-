import { auth, db } from "./firebase.js";

import {
collection,
query,
where,
orderBy,
startAt,
endAt,
getDocs,
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const searchInput=document.getElementById("searchInput");

const searchBtn=document.getElementById("searchBtn");

const resultsContainer=document.getElementById("resultsContainer");

const userAvatar=document.getElementById("userAvatar");

let currentUser;


onAuthStateChanged(auth,async(user)=>{

if(!user){

location.href="login.html";

return;

}

currentUser=user;

loadUser();

const params=new URLSearchParams(location.search);

const q=params.get("q");

if(q){

searchInput.value=q;

searchAll(q);

}

});

async function loadUser(){

const snap=await getDoc(

doc(db,"users",currentUser.uid)

);

if(snap.exists()){

userAvatar.src=snap.data().photo;

}

}

searchBtn.addEventListener("click",()=>{

const keyword=searchInput.value.trim();

if(keyword.length<1) return;

searchAll(keyword);

});

searchInput.addEventListener("keypress",(e)=>{

if(e.key==="Enter"){

searchBtn.click();

}

});

async function searchAll(keyword){

resultsContainer.innerHTML=

'<div class="loading">Searching...</div>';

resultsContainer.innerHTML="";

await searchUsers(keyword);

await searchPosts(keyword);

}


async function searchUsers(keyword){

const q=query(

collection(db,"users"),

orderBy("username"),

startAt(keyword),

endAt(keyword+"\uf8ff")

);

const snapshot=await getDocs(q);

snapshot.forEach(doc=>{

const user=doc.data();

resultsContainer.innerHTML+=`

<div class="userResult"

onclick="location.href='profile.html?uid=${user.uid}'">

<img src="${user.photo}">

<div class="userDetails">

<h3>

${user.username}

</h3>

<p>

${user.bio||""}

</p>

</div>

<button

class="followButton">

Follow

</button>

</div>

`;

});

}

async function searchPosts(keyword){

const q=query(

collection(db,"posts"),

orderBy("title"),

startAt(keyword),

endAt(keyword+"\uf8ff")

);

const snapshot=await getDocs(q);

snapshot.forEach(doc=>{

const post=doc.data();

resultsContainer.innerHTML+=`

<div class="resultCard"

onclick="location.href='post.html?id=${post.postId}'">

<img src="${post.mediaUrl}">

<div class="resultInfo">

<h3>

${post.title}

</h3>

<p>

${post.description.substring(0,120)}...

</p>

<div class="resultMeta">

<span>

👁 ${post.views}

</span>

<span>

❤️ ${post.likes}

</span>

<span>

💬 ${post.comments}

</span>

</div>

</div>

</div>

`;

});

}

function showNoResults(){

if(resultsContainer.innerHTML===""){

resultsContainer.innerHTML=

'<div class="noResults">No results found.</div>';

}

}

setTimeout(showNoResults,1200);