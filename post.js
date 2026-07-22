import { auth, db } from "./firebase.js";

import "./reply.js";

import {
doc,
getDoc,
collection,
query,
where,
orderBy,
limit,
increment,
updateDoc,
deleteDoc,
setDoc,
getDocs,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


import {

toggleLike,
checkIfLiked,

toggleFollow,
checkIfFollowing,

toggleSave,
checkIfSaved,

sharePost,
recordView

} from "./social.js";



import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";


const params=new URLSearchParams(location.search);

const postId=params.get("id");

const singlePost=document.getElementById("singlePost");

const commentsContainer=document.getElementById("commentsContainer");

const relatedPosts=document.getElementById("relatedPosts");

const commentForm=document.getElementById("commentForm");

const commentText=document.getElementById("commentText");

const userAvatar=document.getElementById("userAvatar");

let currentUser;

let postData;


onAuthStateChanged(auth,async(user)=>{

if(!user){

location.href="login.html";

return;

}

currentUser=user;

loadUser();

loadPost();

loadComments();

});


async function loadUser(){

const snap=await getDoc(

doc(db,"users",currentUser.uid)

);

if(snap.exists()){

userAvatar.src=snap.data().photo;

}

}

async function loadPost(){

const snap=await getDoc(

doc(db,"posts",postId)

);

if(!snap.exists()){

singlePost.innerHTML="<h2>Post not found.</h2>";

return;

}

postData=snap.data();

singlePost.innerHTML=`

<div class="postHeader">

<div class="postUser">

<img src="${postData.userPhoto}">

<div class="postUserInfo">

<h3>

<a href="profile.html?uid=${postData.uid}">

${postData.username}

</a>

</h3>

<p>${timeAgo(postData.createdAt)}</p>

</div>

</div>

</div>

<h1 class="postTitle">

${postData.title}

</h1>

<p class="postDescription">

${postData.description}

</p>

${renderMedia(postData)}

<div class="postStats">

<span>👁 ${postData.views}</span>

<span>❤️ ${postData.likes}</span>

<span>💬 ${postData.comments}</span>

<span>💰 ${postData.earnings}</span>

</div>

<div class="postActions">

<button class="likeBtn">❤️ Like</button>

<button class="shareBtn">🔁 Share</button>

<button class="saveBtn">🔖 Save</button>

<button class="followBtn">👤 Follow</button>

</div>

`;

loadRelated();

// Record one view
await recordView(postId);

// Restore Like
const likeBtn = document.querySelector(".likeBtn");

if(await checkIfLiked(postId)){

likeBtn.innerHTML="❤️ Liked";
likeBtn.classList.add("liked");

}

// Restore Save
const saveBtn=document.querySelector(".saveBtn");

if(await checkIfSaved(postId)){

saveBtn.innerHTML="📌 Saved";
saveBtn.classList.add("saved");

}

// Restore Follow
const followBtn=document.querySelector(".followBtn");

if(postData.uid===currentUser.uid){

followBtn.style.display="none";

}else{

if(await checkIfFollowing(postData.uid)){

followBtn.innerHTML="Following";
followBtn.classList.add("following");

}

}


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


//========================================
// LOAD COMMENTS
//========================================

async function loadComments(){

    const q=query(

        collection(db,"comments"),

        where("postId","==",postId),

        orderBy("createdAt","desc")

    );

    const snapshot=await getDocs(q);

    commentsContainer.innerHTML="";

    for(const docSnap of snapshot.docs){

        const c={

            commentId:docSnap.id,

            ...docSnap.data()

        };

        commentsContainer.innerHTML+=`

        <div class="commentCard">

            <img

            src="${c.photo}"

            class="commentAvatar">

            <div class="commentContent">

                <h4>${c.username}</h4>

                <p>${c.comment}</p>

                <div class="commentTime">

                    ${timeAgo(c.createdAt)}

                </div>

                <div class="commentActions">

                    <button

                    onclick="openReplyBox('${c.commentId}')">

                    Reply

                    </button>

                </div>

                <div

                id="replyContainer-${c.commentId}">

                </div>

                <div

                id="replies-${c.commentId}">

                </div>

            </div>

        </div>

        `;

    }

    // Load replies after rendering all comments
    for(const docSnap of snapshot.docs){

        await loadReplies(docSnap.id);

    }

}


//========================================
// COMMENT FORM
//========================================

if(commentForm){

    commentForm.addEventListener(

        "submit",

        async(e)=>{

            e.preventDefault();

            const text=commentText.value.trim();

            if(!text) return;

            try{

                const userSnap=await getDoc(

                    doc(

                        db,

                        "users",

                        currentUser.uid

                    )

                );

                if(!userSnap.exists()) return;

                const user=userSnap.data();

                await addDoc(

                    collection(

                        db,

                        "comments"

                    ),

                    {

                        postId,

                        uid:currentUser.uid,

                        username:user.username,

                        photo:user.photo,

                        comment:text,

                        createdAt:serverTimestamp()

                    }

                );

                await updateDoc(

                    doc(

                        db,

                        "posts",

                        postId

                    ),

                    {

                        comments:increment(1)

                    }

                );

                commentText.value="";

                await loadComments();

            }

            catch(err){

                console.error(err);

                alert(err.message);

            }

        }

    );

}


async function loadRelated(){

    const q=query(

        collection(db,"posts"),

        where("uid","==",postData.uid),

        limit(5)

    );

    const snapshot=await getDocs(q);

    relatedPosts.innerHTML="";

    snapshot.forEach(doc=>{

        const p=doc.data();

        if(p.postId===postId) return;

        relatedPosts.innerHTML+=`

        <div

            class="relatedCard"

            onclick="openRelatedPost('${p.postId}')">

            <img

                src="${p.mediaUrl}"

                class="relatedImage">

            <div class="relatedInfo">

                <h4>${p.title}</h4>

                <p>${p.views || 0} Views</p>

            </div>

        </div>

        `;

    });

}



//==========================================
// OPEN RELATED POST
//==========================================

window.openRelatedPost=function(postId){

    location.href=`post.html?id=${postId}`;

};



function timeAgo(timestamp){

if(!timestamp) return "Just now";

const date=timestamp.toDate();

const diff=Math.floor((Date.now()-date.getTime())/1000);

const m=Math.floor(diff/60);

const h=Math.floor(m/60);

const d=Math.floor(h/24);

if(d>0) return d+"d ago";

if(h>0) return h+"h ago";

if(m>0) return m+"m ago";

return "Just now";

}




document.addEventListener("click",async(e)=>{

/* LIKE */

if(e.target.classList.contains("likeBtn")){

await toggleLike(postId);

if(await checkIfLiked(postId)){

e.target.innerHTML="❤️ Liked";
e.target.classList.add("liked");

}else{

e.target.innerHTML="❤️ Like";
e.target.classList.remove("liked");

}

await loadPost();

}

/* SAVE */

if(e.target.classList.contains("saveBtn")){

await toggleSave(postId);

if(await checkIfSaved(postId)){

e.target.innerHTML="📌 Saved";
e.target.classList.add("saved");

}else{

e.target.innerHTML="🔖 Save";
e.target.classList.remove("saved");

}

}

/* FOLLOW */

if(e.target.classList.contains("followBtn")){

await toggleFollow(postData.uid);

if(await checkIfFollowing(postData.uid)){

e.target.innerHTML="Following";
e.target.classList.add("following");

}else{

e.target.innerHTML="👤 Follow";
e.target.classList.remove("following");

}

}

/* SHARE */

if(e.target.classList.contains("shareBtn")){

await sharePost(postId);

}

});

