import { auth, db } from "./firebase.js";
import { createNotification } from "./notification-helper.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
collection,
doc,
getDoc,
addDoc,
deleteDoc,
query,
orderBy,
onSnapshot,
updateDoc,
increment,
serverTimestamp,
arrayUnion,
arrayRemove
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const params = new URLSearchParams(location.search);
const reelId = params.get("id");

const commentsContainer = document.getElementById("commentsContainer");
const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");

let currentUser;
let currentUserData;
let reelData;

onAuthStateChanged(auth, async (user)=>{

    if(!user){
        location.href="login.html";
        return;
    }

    currentUser=user;

    const me=await getDoc(
        doc(db,"users",user.uid)
    );

    currentUserData=me.data();

    const reelSnap=await getDoc(
        doc(db,"reels",reelId)
    );

    if(reelSnap.exists()){
        reelData=reelSnap.data();
    }

    listenComments();

});

function listenComments(){

    const q=query(

        collection(
            db,
            "reels",
            reelId,
            "comments"
        ),

        orderBy("createdAt","asc")

    );

    onSnapshot(q,(snapshot)=>{

        commentsContainer.innerHTML="";

        snapshot.forEach(docSnap=>{

            renderComment(
                docSnap.data(),
                docSnap.id
            );

        });

    });

}

function renderComment(comment,id){

    const liked=
        comment.likedBy &&
        comment.likedBy.includes(currentUser.uid);

    commentsContainer.innerHTML+=`

<div class="commentCard">

<img
class="commentAvatar"
src="${comment.userPhoto}">

<div class="commentBody">

<h3>${comment.username}</h3>

<p>${comment.comment}</p>

<div class="commentActions">

<button
class="commentLikeBtn"
data-id="${id}">

${liked ? "❤️" : "🤍"}

</button>

<span>${comment.likes || 0}</span>

<button
class="replyBtn"
data-id="${id}">

Reply

</button>

${comment.uid===currentUser.uid ? `

<button
class="deleteCommentBtn"
data-id="${id}">

🗑

</button>

` : ""}

</div>

<div
class="replyBox"
id="replyBox-${id}"
style="display:none;">

<input
type="text"
class="replyInput"
placeholder="Write a reply...">

<button
class="sendReplyBtn"
data-id="${id}">

Send

</button>

</div>

<div
class="replies"
id="replies-${id}">

</div>

<div class="commentTime">

${comment.createdAt?.toDate().toLocaleString() || ""}

</div>

</div>

</div>

`;

    loadReplies(id);

}

function renderReply(reply,id,commentId){

    const liked=
        reply.likedBy &&
        reply.likedBy.includes(currentUser.uid);

    return `

<div class="replyCard">

<img
class="replyAvatar"
src="${reply.userPhoto}">

<div class="replyBody">

<h4>${reply.username}</h4>

<p>${reply.reply}</p>

<div class="replyActions">

<button
class="replyLikeBtn"
data-comment="${commentId}"
data-id="${id}">

${liked ? "❤️" : "🤍"}

</button>

<span>${reply.likes || 0}</span>

${reply.uid===currentUser.uid ? `

<button
class="deleteReplyBtn"
data-comment="${commentId}"
data-id="${id}">

🗑

</button>

` : ""}

</div>

</div>

</div>

`;

}


commentForm.addEventListener("submit",async(e)=>{

e.preventDefault();

const text=commentInput.value.trim();

if(!text) return;

await addDoc(

collection(db,"reels",reelId,"comments"),

{

uid:currentUser.uid,

username:currentUserData.username,

userPhoto:currentUserData.photo,

comment:text,

likes:0,

likedBy:[],

createdAt:serverTimestamp()

}

);

await updateDoc(

doc(db,"reels",reelId),

{

comments:increment(1)

}

);

if(reelData.uid!==currentUser.uid){

await createNotification({

receiverUid:reelData.uid,

senderUid:currentUser.uid,

senderName:currentUserData.username,

senderPhoto:currentUserData.photo,

title:"New Reel Comment",

message:`${currentUserData.username} commented on your reel.`,

type:"reel",

reelId:reelId

});

}

commentForm.reset();

});

document.getElementById("backBtn").onclick=()=>{

history.back();

};

document.addEventListener("click",async(e)=>{

// =======================
// LIKE COMMENT
// =======================

const likeBtn=e.target.closest(".commentLikeBtn");

if(likeBtn){

const ref=doc(

db,

"reels",

reelId,

"comments",

likeBtn.dataset.id

);

const snap=await getDoc(ref);

if(!snap.exists()) return;

const comment=snap.data();

const liked=

comment.likedBy &&

comment.likedBy.includes(currentUser.uid);

if(liked){

await updateDoc(ref,{

likedBy:arrayRemove(currentUser.uid),

likes:increment(-1)

});

}else{

await updateDoc(ref,{

likedBy:arrayUnion(currentUser.uid),

likes:increment(1)

});

}

return;

}

// =======================
// SHOW REPLY BOX
// =======================

const replyBtn=e.target.closest(".replyBtn");

if(replyBtn){

const box=document.getElementById(

`replyBox-${replyBtn.dataset.id}`

);

box.style.display=

box.style.display==="none"

?

"block"

:

"none";

return;

}

// =======================
// SEND REPLY
// =======================

const sendBtn=e.target.closest(".sendReplyBtn");

if(sendBtn){

const commentId=sendBtn.dataset.id;

const input=document.querySelector(

`#replyBox-${commentId} .replyInput`

);

const text=input.value.trim();

if(!text) return;

await addDoc(

collection(

db,

"reels",

reelId,

"comments",

commentId,

"replies"

),

{
