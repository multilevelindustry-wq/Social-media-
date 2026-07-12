import { auth, db } from "./firebase.js";
import { createNotification } from "./notification-helper.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
collection,
query,
where,
orderBy,
getDocs,
doc,
getDoc,
updateDoc,
deleteDoc,
increment,
arrayUnion,
arrayRemove
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const savedContainer=document.getElementById("savedContainer");

let currentUser;
let currentUserData;

onAuthStateChanged(auth,async(user)=>{

if(!user){

location.href="login.html";

return;

}

currentUser=user;

const me=await getDoc(
doc(db,"users",user.uid)
);

currentUserData=me.data();

loadSavedReels();

});

async function loadSavedReels(){

savedContainer.innerHTML="";

const q=query(

collection(db,"savedReels"),

where("uid","==",currentUser.uid),

orderBy("createdAt","desc")

);

const snapshot=await getDocs(q);

for(const save of snapshot.docs){

const saved=save.data();

const reelSnap=await getDoc(

doc(db,"reels",saved.reelId)

);

if(!reelSnap.exists()) continue;

const reel=reelSnap.data();

reel.reelId=reelSnap.id;

renderReel(reel);

}

enableAutoPlay();

}

function renderReel(reel){

const liked=
reel.likedBy &&
reel.likedBy.includes(currentUser.uid);

savedContainer.innerHTML+=`

<section class="savedCard">

<video
class="savedVideo"
playsinline
loop
preload="metadata">

<source src="${reel.videoUrl}">

</video>

<div class="savedInfo">

<h3>@${reel.username}</h3>

<p>${reel.caption}</p>

</div>

<div class="savedActions">

<img
class="savedAvatar"
src="${reel.userPhoto}">

<button
class="likeBtn"
data-id="${reel.reelId}">

${liked?"❤️":"🤍"}

</button>

<span>${reel.likes||0}</span>

<button
class="commentBtn"
data-id="${reel.reelId}">

💬

</button>

<span>${reel.comments||0}</span>

<button
class="shareBtn"
data-id="${reel.reelId}">

🔁

</button>

<span>${reel.shares||0}</span>

<button
class="unsaveBtn"
data-id="${reel.reelId}">

📌

</button>

</div>

</section>

`;

}

function enableAutoPlay(){

const videos=document.querySelectorAll(".savedVideo");

const observer=new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.play();

}else{

entry.target.pause();

}

});

},

{

threshold:0.7

});

videos.forEach(video=>{

observer.observe(video);

});

}

document.getElementById("backBtn").onclick=()=>{

history.back();

};

document.addEventListener("click",async(e)=>{

const likeBtn=e.target.closest(".likeBtn");

if(likeBtn){

const reelRef=doc(
db,
"reels",
likeBtn.dataset.id
);

const snap=await getDoc(reelRef);

if(!snap.exists()) return;

const reel=snap.data();

const liked=
reel.likedBy &&
reel.likedBy.includes(currentUser.uid);

if(liked){

await updateDoc(reelRef,{

likedBy:arrayRemove(currentUser.uid),

likes:increment(-1)

});

likeBtn.innerHTML="🤍";

}else{

await updateDoc(reelRef,{

likedBy:arrayUnion(currentUser.uid),

likes:increment(1)

});

likeBtn.innerHTML="❤️";

if(reel.uid!==currentUser.uid){

await createNotification({

receiverUid:reel.uid,

senderUid:currentUser.uid,

senderName:currentUserData.username,

senderPhoto:currentUserData.photo,

title:"New Like",

message:`${currentUserData.username} liked your reel.`,

type:"like",

postId:likeBtn.dataset.id

});

}

}

return;

}

const commentBtn=e.target.closest(".commentBtn");

if(commentBtn){

location.href=`reel-comments.html?id=${commentBtn.dataset.id}`;

return;

}

const shareBtn=e.target.closest(".shareBtn");

if(shareBtn){

await updateDoc(

doc(db,"reels",shareBtn.dataset.id),

{

shares:increment(1)

}

);

alert("Share feature coming soon.");

return;

}

const unsaveBtn=e.target.closest(".unsaveBtn");

if(unsaveBtn){

await deleteDoc(

doc(
db,
"savedReels",
`${currentUser.uid}_${unsaveBtn.dataset.id}`
)

);

unsaveBtn.closest(".savedCard").remove();

return;

}

});