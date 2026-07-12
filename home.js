import { auth, db } from "./firebase.js";

import {
    toggleLike,
    checkIfLiked
} from "./social.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
collection,
query,
orderBy,
limit,
getDocs,
where,
onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";



const postsContainer=document.getElementById("postsContainer");

let currentUser;

onAuthStateChanged(auth,(user)=>{

if(!user){

location.href="login.html";

return;

}

currentUser=user;

loadPosts();

listenNotificationBadge();

});




async function loadPosts(){

postsContainer.innerHTML="";

const q=query(

collection(db,"posts"),

orderBy("createdAt","desc"),

limit(20)

);

const snapshot=await getDocs(q);

snapshot.forEach(doc=>{

createPostCard(doc.data());

});

}

function createPostCard(post){

const card=document.createElement("div");

card.className="postCard";

card.innerHTML=`

<div class="postHeader">

<div class="postUser">

<img
src="${post.userPhoto}">

<div class="postUserInfo">

<h3>

<a href="profile.html?uid=${post.uid}">

${post.username}

</a>

</h3>

<p>${timeAgo(post.createdAt)}</p>

</div>

</div>

<button
class="followBtn"
data-user="${post.uid}">

Follow

</button>

</div>

<div class="postBody">

<h2 class="postTitle">

${post.title}

</h2>

<p class="postDescription">

${post.description}

</p>

${renderMedia(post)}

</div>

${renderFooter(post)}

`;

postsContainer.appendChild(card);

const likeBtn = card.querySelector(".likeBtn");

checkIfLiked(post.postId).then((liked) => {

    if (liked) {

        likeBtn.innerHTML = "❤️ Liked";
        likeBtn.classList.add("liked");

    }

});


}

function renderMedia(post){

if(post.mediaType==="image"){

return`

<div class="postMedia">

<img

loading="lazy"

src="${post.mediaUrl}">

</div>

`;

}

return`

<div class="postMedia">

<video

controls

preload="metadata">

<source src="${post.mediaUrl}">

</video>

</div>

`;

}

function renderFooter(post){

return`

<div class="postStats">

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

<div class="postActions">

<button class="likeBtn"

data-id="${post.postId}">

❤️ Like

</button>

<button class="commentBtn"

data-id="${post.postId}">

💬 Comment

</button>

<button class="shareBtn"

data-id="${post.postId}">

🔁 Share

</button>

<button class="saveBtn"

data-id="${post.postId}">

🔖 Save

</button>

<button class="viewBtn"

data-id="${post.postId}">

👁 Open

</button>

</div>

`;

}

function timeAgo(timestamp){

if(!timestamp) return "Just now";

const date=timestamp.toDate();

const seconds=Math.floor(

(Date.now()-date.getTime())/1000

);

const minutes=Math.floor(seconds/60);

const hours=Math.floor(minutes/60);

const days=Math.floor(hours/24);

if(days>0) return days+"d ago";

if(hours>0) return hours+"h ago";

if(minutes>0) return minutes+"m ago";

return "Just now";

}

document.addEventListener("click",(e)=>{

if(e.target.classList.contains("viewBtn")){

const id=e.target.dataset.id;

location.href=`post.html?id=${id}`;

}

if(e.target.classList.contains("commentBtn")){

const id=e.target.dataset.id;

location.href=`post.html?id=${id}#comments`;

}

if(e.target.classList.contains("shareBtn")){

const id=e.target.dataset.id;

alert("Share feature coming soon.");

}

if(e.target.classList.contains("saveBtn")){

const id=e.target.dataset.id;

alert("Save feature coming soon.");

}

if (e.target.classList.contains("likeBtn")) {

    const button = e.target;

    const postId = button.dataset.id;

    await toggleLike(postId);

    const liked = await checkIfLiked(postId);

    if (liked) {

        button.innerHTML = "❤️ Liked";
        button.classList.add("liked");

    } else {

        button.innerHTML = "❤️ Like";
        button.classList.remove("liked");

    }

}

});



function listenNotificationBadge(){

const badge=document.getElementById("notificationBadge");

if(!badge) return;

const q=query(

collection(db,"notifications"),

where("receiverUid","==",currentUser.uid)

);

onSnapshot(q,(snapshot)=>{

let unread=0;

snapshot.forEach(doc=>{

const data=doc.data();

if(!data.isRead){

unread++;

}

});

if(unread>0){

badge.style.display="flex";
badge.textContent=unread;

}else{

badge.style.display="none";
badge.textContent="0";

}

});

}






document.getElementById("host-liveBtn").onclick=()=>{
location.href="host-live.html";
};

document.getElementById("groupsBtn").onclick=()=>{
location.href="groups.html";
};

document.getElementById("reelsBtn").onclick=()=>{
location.href="reels.html";
};

document.getElementById("dashboardBtn").onclick=()=>{
location.href="dashboard.html";
};

document.getElementById("settingsBtn").onclick=()=>{
location.href="settings.html";
};










