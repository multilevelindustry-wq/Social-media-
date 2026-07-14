//==================================================
// FIREBASE
//==================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    orderBy,

    // NEW
    onSnapshot
}
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


//==================================================
// URL
//==================================================

const params = new URLSearchParams(location.search);

const postId = params.get("id");

if(!postId){

    location.href="groups.html";

}


//==================================================
// USER
//==================================================

let currentUser = null;

let currentUserData = null;

let currentPost = null;


//==================================================
// REALTIME LISTENERS
//==================================================

let unsubscribePost = null;

let unsubscribeComments = null;


//==================================================
// DOM
//==================================================

const loadingOverlay =
document.getElementById("loadingOverlay");

const postContainer =
document.getElementById("postContainer");

const commentsList =
document.getElementById("commentsList");

const commentText =
document.getElementById("commentText");

const commentAvatar =
document.getElementById("commentAvatar");

const sendCommentBtn =
document.getElementById("sendComment");

const backBtn =
document.getElementById("backBtn");


//==================================================
// LOADING
//==================================================

function showLoading(){

    loadingOverlay.style.display="flex";

}

function hideLoading(){

    loadingOverlay.style.display="none";

}


//==================================================
// TOAST
//==================================================

function showToast(message){

    let toast=document.getElementById("toast");

    if(!toast){

        toast=document.createElement("div");

        toast.id="toast";

        toast.className="toast";

        document.body.appendChild(toast);

    }

    toast.textContent=message;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },2500);

}


//==================================================
// BACK BUTTON
//==================================================

backBtn.onclick=()=>{

    history.back();

};


//==================================================
// AUTH
//==================================================

onAuthStateChanged(auth,async(user)=>{

    if(!user){

        location.href="login.html";

        return;

    }

    currentUser=user;

    showLoading();

    try{

        await loadCurrentUser();

        await increaseViewOnce();

        startRealtimePost();

        startRealtimeComments();

    }

    catch(err){

        console.error(err);

        alert(err.message);

    }

    hideLoading();

});


//==================================================
// LOAD USER
//==================================================

async function loadCurrentUser(){

    const snap=

    await getDoc(

        doc(db,"users",currentUser.uid)

    );

    if(!snap.exists()) return;

    currentUserData=snap.data();

    commentAvatar.src=

        currentUserData.photo ||

        "assets/default-avatar.png";

}


//==================================================
// COUNT VIEW ONCE
//==================================================

async function increaseViewOnce(){

    const ref = doc(db,"groupPosts",postId);

    const snap = await getDoc(ref);

    if(!snap.exists()) return;

    const post = snap.data();

    const viewedBy = post.viewedBy || [];

    if(viewedBy.includes(currentUser.uid)){
        return;
    }

    await updateDoc(ref,{
        views: increment(1),
        viewedBy: arrayUnion(currentUser.uid)
    });

}



//==================================================
// REALTIME POST
//==================================================

function startRealtimePost(){

    if(unsubscribePost){

        unsubscribePost();

    }

    unsubscribePost = onSnapshot(

        doc(db,"groupPosts",postId),

        (snap)=>{

            if(!snap.exists()){

                postContainer.innerHTML=`

                <div class="emptyState">

                    <h2>Post not found</h2>

                </div>

                `;

                return;

            }

            currentPost=snap.data();

            renderPost(currentPost);

        }

    );

}


//==================================================
// RENDER POST
//==================================================

function renderPost(post){

    const liked=(post.likedBy||[]).includes(currentUser.uid);

    postContainer.innerHTML=`

    <div class="postCard">

        <div class="postTop">

            <img

            class="postAvatar"

            src="${post.userPhoto||'assets/default-avatar.png'}">

            <div class="postUser">

                <h3>${post.username}</h3>

                <p>${formatTime(post.createdAt)}</p>

            </div>

        </div>

        ${post.title?`

        <h2 class="postTitle">

            ${post.title}

        </h2>

        `:""}

        <p class="postDescription">

            ${post.description||""}

        </p>

        ${renderMedia(post)}

        <div class="postStats">

            <span>👁 ${post.views||0}</span>

            <span>❤️ ${post.likes||0}</span>

            <span>💬 ${post.comments||0}</span>

            <span>↗ ${post.shares||0}</span>

        </div>

        <div class="postActions">

            <button

            id="likeBtn"

            class="${liked?"liked":""}">

                ${liked?"❤️ Liked":"👍 Like"}

            </button>

            <button id="shareBtn">

                ↗ Share

            </button>

        </div>

    </div>

    `;

}


//==================================================
// MEDIA
//==================================================

function renderMedia(post){

    if(!post.mediaUrl){

        return "";

    }

    if(post.mediaType==="image"){

        return`

        <img

        class="postImage"

        src="${post.mediaUrl}"

        loading="lazy">

        `;

    }

    return`

    <video

    class="postVideo"

    controls

    preload="metadata">

        <source src="${post.mediaUrl}">

    </video>

    `;

}


//==================================================
// TIME
//==================================================

function formatTime(timestamp){

    if(!timestamp){

        return"Just now";

    }

    return timestamp.toDate()

    .toLocaleString([],{

        dateStyle:"medium",

        timeStyle:"short"

    });

}


//==================================================
// LIKE
//==================================================

async function likePost(){

    const liked=

    (currentPost.likedBy||[])

    .includes(currentUser.uid);

    await updateDoc(

        doc(db,"groupPosts",postId),

        liked?

        {

            likedBy:arrayRemove(currentUser.uid),

            likes:increment(-1)

        }

        :

        {

            likedBy:arrayUnion(currentUser.uid),

            likes:increment(1)

        }

    );

}


//==================================================
// SHARE
//==================================================

async function sharePost(){

    await updateDoc(

        doc(db,"groupPosts",postId),

        {

            shares:increment(1)

        }

    );

    const url=

    location.origin+

    "/group-post.html?id="+postId;

    if(navigator.share){

        try{

            await navigator.share({

                title:currentPost.title||

                "CreatorHub",

                text:currentPost.description,

                url

            });

        }

        catch(err){}

    }

    else{

        await navigator.clipboard.writeText(url);

        showToast("Link copied.");

    }

}


//==================================================
// POST BUTTONS
//==================================================

document.addEventListener("click",async(e)=>{

    if(e.target.id==="likeBtn"){

        await likePost();

    }

    if(e.target.id==="shareBtn"){

        await sharePost();

    }

});




//==================================================
// REALTIME COMMENTS
//==================================================

function startRealtimeComments(){

    if(unsubscribeComments){

        unsubscribeComments();

    }

    const q=query(

        collection(db,"groupComments"),

        where("postId","==",postId),

        orderBy("createdAt","asc")

    );

    unsubscribeComments=onSnapshot(

        q,

        (snapshot)=>{

            commentsList.innerHTML="";

            if(snapshot.empty){

                commentsList.innerHTML=`

                <div class="noComments">

                    No comments yet.

                </div>

                `;

                return;

            }

            snapshot.forEach(docSnap=>{

                const comment=docSnap.data();

                const commentId=docSnap.id;

                renderComment(commentId,comment);

            });

        }

    );

}



//==================================================
// RENDER COMMENT
//==================================================

function renderComment(commentId,c){

    commentsList.innerHTML+=`

<div class="commentCard">

<img

class="commentAvatar"

src="${c.userPhoto||'assets/default-avatar.png'}">

<div class="commentBody">

<div class="commentBubble">

<h4>${c.username}</h4>

<p>${c.comment}</p>

</div>

<div class="commentFooter">

<span>

${formatTime(c.createdAt)}

</span>

<button

class="replyBtn"

data-id="${commentId}">

Reply

</button>

<button

class="likeCommentBtn"

data-id="${commentId}">

❤️ ${c.likes||0}

</button>

${c.uid===currentUser.uid?`

<button

class="editCommentBtn"

data-id="${commentId}">

Edit

</button>

<button

class="deleteCommentBtn"

data-id="${commentId}">

Delete

</button>

`:""}

</div>

<div

id="replyArea-${commentId}">

</div>
</div>

</div>

`;

setTimeout(()=>{

loadReplies(commentId);

},50);


}


//==================================================
// SEND COMMENT
//==================================================

async function sendComment(){

    const text=

    commentText.value.trim();

    if(!text) return;

    commentText.value="";

    await addDoc(

        collection(db,"groupComments"),

        {

            postId,

            uid:currentUser.uid,

            username:currentUserData.username,

            userPhoto:

            currentUserData.photo||

            "assets/default-avatar.png",

            comment:text,

            likes:0,

            likedBy:[],

            createdAt:serverTimestamp()

        }

    );

    await updateDoc(

        doc(db,"groupPosts",postId),

        {

            comments:increment(1)

        }

    );

}



//==================================================
// DELETE COMMENT
//==================================================

async function deleteComment(commentId){

    if(!confirm(

        "Delete this comment?"

    )) return;

    await deleteDoc(

        doc(db,"groupComments",commentId)

    );

    await updateDoc(

        doc(db,"groupPosts",postId),

        {

            comments:increment(-1)

        }

    );

}



//==================================================
// LIKE COMMENT
//==================================================

async function likeComment(commentId){

    const ref=

    doc(db,"groupComments",commentId);

    const snap=

    await getDoc(ref);

    const comment=snap.data();

    const liked=

    (comment.likedBy||[])

    .includes(currentUser.uid);

    await updateDoc(

        ref,

        liked?

        {

            likedBy:

            arrayRemove(currentUser.uid),

            likes:increment(-1)

        }

        :

        {

            likedBy:

            arrayUnion(currentUser.uid),

            likes:increment(1)

        }

    );

}



//==================================================
// EDIT COMMENT
//==================================================

async function editComment(commentId){

    const ref=

    doc(db,"groupComments",commentId);

    const snap=

    await getDoc(ref);

    const comment=snap.data();

    const text=prompt(

        "Edit comment",

        comment.comment

    );

    if(text===null) return;

    if(text.trim()==="") return;

    await updateDoc(

        ref,

        {

            comment:text.trim(),

            edited:true

        }

    );

}



//==================================================
// SHOW REPLY BOX
//==================================================

function showReplyBox(commentId, parentReplyId = ""){

    const area = document.getElementById(
        `replyArea-${commentId}`
    );

    if(!area) return;

    area.innerHTML = `
        <div class="replyInput">

            <input
                id="replyText-${commentId}-${parentReplyId}"
                placeholder="Write a reply...">

            <button
                class="sendReplyBtn"
                data-comment="${commentId}"
                data-parent="${parentReplyId}">
                Reply
            </button>

        </div>
    `;

}



//==================================================
// COMMENT & REPLY EVENTS
//==================================================

document.addEventListener("click", async (e)=>{

    //============================
    // SEND COMMENT
    //============================

    if(e.target.id==="sendComment"){

        await sendComment();

    }

    //============================
    // DELETE COMMENT
    //============================

    if(e.target.classList.contains("deleteCommentBtn")){

        await deleteComment(
            e.target.dataset.id
        );

    }

    //============================
    // EDIT COMMENT
    //============================

    if(e.target.classList.contains("editCommentBtn")){

        await editComment(
            e.target.dataset.id
        );

    }

    //============================
    // LIKE COMMENT
    //============================

    if(e.target.classList.contains("likeCommentBtn")){

        await likeComment(
            e.target.dataset.id
        );

    }

 //============================
    // SHOW REPLY BOX
    //============================

    if(e.target.classList.contains("replyBtn")){

        showReplyBox(
            e.target.dataset.id
        );

    }



    //============================
    // REPLY TO REPLY
    //============================

    if(e.target.classList.contains("replyReplyBtn")){

        showReplyBox(
            e.target.dataset.comment,
            e.target.dataset.parent
        );

    }
    

    //============================
    // SEND REPLY
    //============================

    if(e.target.classList.contains("sendReplyBtn")){

        const commentId=e.target.dataset.comment;

        const parent=e.target.dataset.parent;

        const input=document.getElementById(
            `replyText-${commentId}-${parent}`
        );

        if(!input) return;

        await sendReply(
            commentId,
            parent,
            input.value
        );

        input.value="";

    }

    //============================
    // LIKE REPLY
    //============================

    if(e.target.classList.contains("likeReplyBtn")){

        await likeReply(
            e.target.dataset.id
        );

    }

    //============================
    // EDIT REPLY
    //============================

    if(e.target.classList.contains("editReplyBtn")){

        await editReply(
            e.target.dataset.id
        );

    }

    //============================
    // DELETE REPLY
    //============================

    if(e.target.classList.contains("deleteReplyBtn")){

        await deleteReply(
            e.target.dataset.id
        );

    }

});



//==================================================
// SEND REPLY
//==================================================


async function sendReply(commentId, parentReplyId, text){

    if(!text.trim()) return;

    // Create the reply
    await addDoc(

        collection(db,"groupReplies"),

        {

            postId,

            commentId,

            parentReplyId,

            uid:currentUser.uid,

            username:currentUserData.username,

            userPhoto:
                currentUserData.photo ||
                "assets/default-avatar.png",

            reply:text,

            likes:0,

            likedBy:[],

            createdAt:serverTimestamp()

        }

    );

    // Notify the comment owner
    const commentSnap = await getDoc(
        doc(db,"groupComments",commentId)
    );

    if(commentSnap.exists()){

        const owner = commentSnap.data();

        if(owner.uid !== currentUser.uid){

            await addDoc(

                collection(db,"notifications"),

                {

                    uid:owner.uid,

                    senderUid:currentUser.uid,

                    senderName:currentUserData.username,

                    type:"reply",

                    postId,

                    commentId,

                    message:`${currentUserData.username} replied to your comment`,

                    read:false,

                    createdAt:serverTimestamp()

                }

            );

        }

    }

    // Notify the owner of the reply being replied to
    if(parentReplyId){

        const replySnap = await getDoc(
            doc(db,"groupReplies",parentReplyId)
        );

        if(replySnap.exists()){

            const owner = replySnap.data();

            if(owner.uid !== currentUser.uid){

                await addDoc(

                    collection(db,"notifications"),

                    {

                        uid:owner.uid,

                        senderUid:currentUser.uid,

                        senderName:currentUserData.username,

                        type:"replyReply",

                        postId,

                        message:`${currentUserData.username} replied to your reply`,

                        read:false,

                        createdAt:serverTimestamp()

                    }

                );

            }

        }

    }

}





//==================================================
// LOAD REPLIES
//==================================================

function loadReplies(commentId){

const q=query(

collection(db,"groupReplies"),

where("commentId","==",commentId),

orderBy("createdAt","asc")

);

onSnapshot(q,(snapshot)=>{

renderReplyTree(

commentId,

snapshot.docs

);

});

}



//==================================================
// BUILD REPLY TREE
//==================================================

function renderReplyTree(

commentId,

docs

){

const area=document.getElementById(

`replyArea-${commentId}`

);

if(!area) return;

const replies={};

docs.forEach(doc=>{

replies[doc.id]={

id:doc.id,

...doc.data(),

children:[]

};

});

Object.values(replies)

.forEach(reply=>{

if(

reply.parentReplyId &&

replies[reply.parentReplyId]

){

replies[reply.parentReplyId]

.children.push(reply);

}

});

const roots=

Object.values(replies)

.filter(r=>!r.parentReplyId);

area.innerHTML=

roots.map(r=>

renderReply(r)

).join("");

}





//==================================================
// RENDER REPLY
//==================================================

function renderReply(reply){

return`

<div class="replyCard">

<img

class="replyAvatar"

src="${reply.userPhoto}">

<div class="replyBody">

<div class="replyBubble">

<h4>

${

reply.uid===currentUser.uid

?

"You"

:

reply.username

}

${

reply.edited

?

'<small>(edited)</small>'

:

''

}

</h4>

<p>${reply.reply}</p>

</div>

<div class="replyFooter">

<span>

${formatTime(reply.createdAt)}

</span>

<button

class="replyReplyBtn"

data-comment="${reply.commentId}"

data-parent="${reply.id}">

Reply

</button>

<button

class="likeReplyBtn"

data-id="${reply.id}">

❤️ ${reply.likes||0}

</button>

${

reply.uid===currentUser.uid?

`

<button

class="editReplyBtn"

data-id="${reply.id}">

Edit

</button>

<button

class="deleteReplyBtn"

data-id="${reply.id}">

Delete

</button>

`

:""

}

</div>

<div

id="children-${reply.id}"

class="replyChildren">

${

reply.children

.map(child=>

renderReply(child)

)

.join("")

}

</div>

</div>

</div>

`;

}







//==================================
// REPLY TO REPLY
//==================================

document.addEventListener(

"click",

e=>{

if(

!e.target.classList.contains(

"replyReplyBtn"

)

) return;

showReplyBox(

e.target.dataset.comment,

e.target.dataset.parent

);

});




//==================================================
// LIKE REPLY
//==================================================

async function likeReply(replyId){

const ref=doc(db,"groupReplies",replyId);

const snap=await getDoc(ref);

if(!snap.exists()) return;

const reply=snap.data();

const liked=(reply.likedBy||[])

.includes(currentUser.uid);

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

}





//==================================================
// EDIT REPLY
//==================================================

async function editReply(replyId){

const ref=doc(db,"groupReplies",replyId);

const snap=await getDoc(ref);

if(!snap.exists()) return;

const reply=snap.data();

const text=prompt(

"Edit reply",

reply.reply

);

if(text===null) return;

if(!text.trim()) return;

await updateDoc(ref,{

reply:text.trim(),

edited:true

});

}




//==================================================
// DELETE REPLY
//==================================================

async function deleteReply(replyId){

const ok=confirm(

"Delete this reply?"

);

if(!ok) return;

await deleteDoc(

doc(db,"groupReplies",replyId)

);

}


