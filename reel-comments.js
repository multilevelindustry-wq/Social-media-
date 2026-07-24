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

uid:currentUser.uid,

username:currentUserData.username,

userPhoto:currentUserData.photo,

reply:text,

likes:0,

likedBy:[],

createdAt:serverTimestamp()

}

);

const commentRef=doc(

db,

"reels",

reelId,

"comments",

commentId

);

const commentSnap=await getDoc(commentRef);

if(commentSnap.exists()){

const comment=commentSnap.data();

if(comment.uid!==currentUser.uid){

await createNotification({

receiverUid:comment.uid,

senderUid:currentUser.uid,

senderName:currentUserData.username,

senderPhoto:currentUserData.photo,

title:"New Reel Reply",

message:`${currentUserData.username} replied to your reel comment.`,

type:"reel",

reelId:reelId

});

}

}

input.value="";

document.getElementById(

`replyBox-${commentId}`

).style.display="none";

loadReplies(commentId);

return;

}

// =======================
// LIKE REPLY
// =======================

const replyLikeBtn=e.target.closest(".replyLikeBtn");

if(replyLikeBtn){

const commentId=replyLikeBtn.dataset.comment;

const replyId=replyLikeBtn.dataset.id;

const replyRef=doc(

db,

"reels",

reelId,

"comments",

commentId,

"replies",

replyId

);

const snap=await getDoc(replyRef);

if(!snap.exists()) return;

const reply=snap.data();

const liked=

reply.likedBy &&

reply.likedBy.includes(currentUser.uid);

if(liked){

await updateDoc(replyRef,{

likedBy:arrayRemove(currentUser.uid),

likes:increment(-1)

});

}else{

await updateDoc(replyRef,{

likedBy:arrayUnion(currentUser.uid),

likes:increment(1)

});

}

loadReplies(commentId);

return;

}

// =======================
// DELETE REPLY
// =======================

const deleteReplyBtn=e.target.closest(".deleteReplyBtn");

if(deleteReplyBtn){

if(!confirm("Delete this reply?")) return;

await deleteDoc(

doc(

db,

"reels",

reelId,

"comments",

deleteReplyBtn.dataset.comment,

"replies",

deleteReplyBtn.dataset.id

)

);

loadReplies(deleteReplyBtn.dataset.comment);

return;

}

// =======================
// DELETE COMMENT
// =======================

const deleteCommentBtn=e.target.closest(".deleteCommentBtn");

if(deleteCommentBtn){

if(!confirm("Delete this comment?")) return;

await deleteDoc(

doc(

db,

"reels",

reelId,

"comments",

deleteCommentBtn.dataset.id

)

);

await updateDoc(

doc(db,"reels",reelId),

{

comments:increment(-1)

}

);

return;

}

});


function loadReplies(commentId){

    const repliesBox=document.getElementById(
        `replies-${commentId}`
    );

    if(!repliesBox) return;

    const q=query(

        collection(
            db,
            "reels",
            reelId,
            "comments",
            commentId,
            "replies"
        ),

        orderBy("createdAt","asc")

    );

    onSnapshot(q,(snapshot)=>{

        repliesBox.innerHTML="";

        snapshot.forEach(docSnap=>{

            repliesBox.innerHTML+=renderReply(

                docSnap.data(),

                docSnap.id,

                commentId

            );

        });

    });

}


