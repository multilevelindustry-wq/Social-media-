import { auth, db } from "./firebase.js";

import { appendReelWithAds } from "./reelads.js";


import "./reelads.js";

import { createNotification } from "./notification-helper.js";

import {

    init,
    insertAds,
    watchFeed,
    openPost

} from "./ads.js";
await init();

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import{
collection,
query,
orderBy,
getDocs,
doc,
getDoc,
updateDoc,
increment,
arrayUnion,
arrayRemove,
setDoc,
deleteDoc,
serverTimestamp
}
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const reelsContainer=document.getElementById("reelsContainer");

const params = new URLSearchParams(location.search);
const targetReel = params.get("reel");

let currentUser;
let currentUserData;

onAuthStateChanged(auth,async(user)=>{

if(!user){

location.href="login.html";
return;

}

currentUser=user;

const userSnap=await getDoc(
doc(db,"users",user.uid)
);

currentUserData=userSnap.data();

loadReels();

});




async function loadReels(){

    reelsContainer.innerHTML="";

    const q=query(

        collection(db,"reels"),

        orderBy("createdAt","desc")

    );

    const snapshot=await getDocs(q);

    let reelIndex=0;

    for(const docSnap of snapshot.docs){

        const reel=docSnap.data();

        reel.reelId=docSnap.id;

        //----------------------------------
        // CREATE REEL
        //----------------------------------

        const reelCard=renderReel(reel);

        //----------------------------------
        // APPEND REEL + ADS
        //----------------------------------

        appendReelWithAds(

            reelsContainer,

            reelCard,

            reelIndex

        );

        reelIndex++;

    }

    //----------------------------------
    // ENABLE AUTOPLAY
    //----------------------------------

    enableAutoPlay();

    //----------------------------------
    // SCROLL TO TARGET REEL
    //----------------------------------

    if(targetReel){

        const target=document.querySelector(

            `[data-id="${targetReel}"]`

        );

        if(target){

            target.scrollIntoView({

                behavior:"instant",

                block:"start"

            });

        }

    }

}



function renderReel(reel){

    const liked=

        reel.likedBy &&

        reel.likedBy.includes(currentUser.uid);

    const likeIcon=

        liked ? "❤️" : "🤍";

    const card=document.createElement("section");

    card.className="reelCard";

    card.dataset.id=reel.reelId;

    card.innerHTML=`

<video
class="reelVideo"
playsinline
loop
preload="metadata">

<source src="${reel.videoUrl}">

</video>

<div class="reelInfo">

<h3>@${reel.username}</h3>

<p>${reel.caption}</p>

</div>

<div class="reelActions">

<img
class="reelAvatar"
src="${reel.userPhoto}">

<button
class="likeBtn"
data-id="${reel.reelId}">

${likeIcon}

</button>

<span class="likesCount">

${reel.likes||0}

</span>

<button
class="commentBtn"
data-id="${reel.reelId}">

💬

</button>

<span>

${reel.comments||0}

</span>

<button
class="shareBtn"
data-id="${reel.reelId}">

🔁

</button>

<span>

${reel.shares||0}

</span>

<button
class="saveBtn"
data-id="${reel.reelId}">

🔖

</button>

</div>

`;

    return card;

}




function enableAutoPlay(){

const videos=document.querySelectorAll(".reelVideo");

const observer=new IntersectionObserver(entries=>{

entries.forEach(entry=>{

const video=entry.target;

if(entry.isIntersecting){

video.play();

}else{

video.pause();

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

document.getElementById("cameraBtn").onclick=()=>{

location.href="upload-reel.html";

};



document.addEventListener("click",async(e)=>{

// =======================
// LIKE REEL
// =======================

const btn=e.target.closest(".likeBtn");

if(btn){

const likesCount=btn.nextElementSibling;

const reelId=btn.dataset.id;

const reelRef=doc(db,"reels",reelId);

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

btn.innerHTML="🤍";

likesCount.textContent=
Number(likesCount.textContent)-1;

}else{

await updateDoc(reelRef,{

likedBy:arrayUnion(currentUser.uid),

likes:increment(1)

});

btn.innerHTML="❤️";

likesCount.textContent=
Number(likesCount.textContent)+1;

if(reel.uid!==currentUser.uid){

await createNotification({

receiverUid:reel.uid,

senderUid:currentUser.uid,

senderName:currentUserData.username,

senderPhoto:currentUserData.photo,

title:"New Like",

message:`${currentUserData.username} liked your reel.`,

type:"like",

postId:reelId

});

}

}
return;

}

// =======================
// OPEN COMMENTS
// =======================

const commentBtn=e.target.closest(".commentBtn");

if(commentBtn){

location.href=
`reel-comments.html?id=${commentBtn.dataset.id}`;

return;

}

// =======================
// SHARE REEL
// =======================

const shareBtn=e.target.closest(".shareBtn");

if(shareBtn){

const reelId=shareBtn.dataset.id;

const reelRef=doc(db,"reels",reelId);

await updateDoc(reelRef,{

shares:increment(1)

});

const shareCount=
shareBtn.nextElementSibling;

shareCount.textContent=
Number(shareCount.textContent)+1;

const url=
`${location.origin}/reel.html?id=${reelId}`;

if(navigator.share){

try{

await navigator.share({

title:"Check out this reel",

url

});

}catch(err){}

}else{

await navigator.clipboard.writeText(url);

alert("Reel link copied!");

}

return;

}


const saveBtn=e.target.closest(".saveBtn");

if(saveBtn){

const reelId=saveBtn.dataset.id;

const saveRef=doc(
db,
"savedReels",
`${currentUser.uid}_${reelId}`
);

const snap=await getDoc(saveRef);

if(snap.exists()){

await deleteDoc(saveRef);

saveBtn.innerHTML="🔖";

}else{

await setDoc(saveRef,{

uid:currentUser.uid,

reelId,

createdAt:serverTimestamp()

});

saveBtn.innerHTML="📌";

}

return;

}

});


