import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
collection,
query,
where,
getDocs,
doc,
getDoc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const creatorName=document.getElementById("creatorName");

const myAvatar=document.getElementById("myAvatar");

const myPosts=document.getElementById("myPosts");

const uploadPost=document.getElementById("uploadPost");

const searchPost=document.getElementById("searchPost");

let currentUser;

let posts=[];


onAuthStateChanged(auth,async(user)=>{

if(!user){

location.href="login.html";

return;

}

currentUser=user;

await loadUser();

await loadPosts();

drawChart();

});


async function loadUser(){

const snap=await getDoc(

doc(db,"users",currentUser.uid)

);

if(!snap.exists()) return;

const user=snap.data();

creatorName.textContent=user.username;

myAvatar.src=user.photo;

}


async function loadPosts(){

const q=query(

collection(db,"posts"),

where("uid","==",currentUser.uid)

);

const snapshot=await getDocs(q);

posts=[];

myPosts.innerHTML="";

let totalViews=0;

let totalLikes=0;

let totalComments=0;

let totalIncome=0;

snapshot.forEach(docSnap=>{

const post=docSnap.data();

posts.push(post);

totalViews+=post.views||0;

totalLikes+=post.likes||0;

totalComments+=post.comments||0;

totalIncome+=post.earnings||0;

renderPost(post);

});

document.getElementById("postsCount").textContent=posts.length;

document.getElementById("viewsCount").textContent=totalViews;

document.getElementById("likesCount").textContent=totalLikes;

document.getElementById("commentsCount").textContent=totalComments;

document.getElementById("earningsCount").textContent="$"+totalIncome.toFixed(2);

}

function renderPost(post){

myPosts.innerHTML+=`

<div class="dashboardCard">

${renderMedia(post)}

<div class="dashboardContent">

<h3>${post.title}</h3>

<p>${(post.description||"").substring(0,120)}...</p>

<div class="dashboardMeta">

<span>👁 ${post.views}</span>

<span>❤️ ${post.likes}</span>

<span>💬 ${post.comments}</span>

</div>

<div class="dashboardButtons">

<button

class="editBtn"

data-id="${post.postId}">

Edit

</button>

<button

class="deleteBtn"

data-id="${post.postId}">

Delete

</button>

</div>

</div>

</div>

`;

}




function renderMedia(post){

if(post.mediaType==="image"){

return `

<img src="${post.mediaUrl}" loading="lazy">

`;

}

return `

<video controls>

<source src="${post.mediaUrl}">

</video>

`;

}


document.addEventListener("click",async(e)=>{

if(e.target.classList.contains("editBtn")){

const id=e.target.dataset.id;

location.href=`edit-post.html?id=${id}`;

}

if(e.target.classList.contains("deleteBtn")){

const id=e.target.dataset.id;

const ok=confirm("Delete this post?");

if(!ok) return;

await deleteDoc(doc(db,"posts",id));

loadPosts();

}

});

uploadPost.onclick=()=>{

location.href="upload.html";

};


searchPost.addEventListener("input",()=>{

const keyword=searchPost.value.toLowerCase();

document.querySelectorAll(".dashboardCard").forEach(card=>{

const title=card.querySelector("h3").textContent.toLowerCase();

card.style.display=

title.includes(keyword)?"block":"none";

});

});

function drawChart(){

const ctx=document.getElementById("viewsChart");

if(!ctx) return;

new Chart(ctx,{

type:"line",

data:{

labels:["Posts","Views","Likes","Comments"],

datasets:[{

label:"Creator Analytics",

data:[

posts.length,

Number(document.getElementById("viewsCount").textContent),

Number(document.getElementById("likesCount").textContent),

Number(document.getElementById("commentsCount").textContent)

],

fill:false,

tension:.4

}]

},

options:{

responsive:true,

maintainAspectRatio:true

}

});

}