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
setDoc,
addDoc,
deleteDoc,
serverTimestamp,
arrayUnion,
arrayRemove,
increment,
orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


//========================================
// CLOUDINARY
//========================================

const CLOUD_NAME="diqrjgobk";

const UPLOAD_PRESET="starcode";


//========================================
// URL
//========================================

const params=new URLSearchParams(location.search);

const groupId=params.get("id");


//========================================
// USER
//========================================

let currentUser=null;

let currentUserData=null;

let currentGroup=null;

let groupPosts=[];


//========================================
// DOM
//========================================

const loadingOverlay=
document.getElementById("loadingOverlay");

const toast=
document.getElementById("toast");

const userAvatar=
document.getElementById("userAvatar");

const createAvatar=
document.getElementById("createAvatar");

const groupCover=
document.getElementById("groupCover");

const groupAvatar=
document.getElementById("groupAvatar");

const groupName=
document.getElementById("groupName");

const groupDescription=
document.getElementById("groupDescription");

const memberCount=
document.getElementById("memberCount");

const postCount=
document.getElementById("postCount");

const privacyType=
document.getElementById("privacyType");

const aboutGroup=
document.getElementById("aboutGroup");

const aboutMembers=
document.getElementById("aboutMembers");

const aboutPrivacy=
document.getElementById("aboutPrivacy");

const aboutCreated=
document.getElementById("aboutCreated");

const groupCreated=
document.getElementById("groupCreated");

const memberPreview=
document.getElementById("memberPreview");

const membersList=
document.getElementById("membersList");

const groupPostsContainer=
document.getElementById("groupPosts");

const joinBtn=
document.getElementById("joinBtn");

const inviteBtn=
document.getElementById("inviteBtn");

const shareGroupBtn=
document.getElementById("shareGroupBtn");

const editGroupBtn=
document.getElementById("editGroupBtn");

const analyticsCard=
document.getElementById("analyticsCard");

const editCoverInput =
document.getElementById("editCoverInput");

const editAvatarInput =
document.getElementById("editAvatarInput");

const editCoverPreview =
document.getElementById("editCoverPreview");

const editAvatarPreview =
document.getElementById("editAvatarPreview");

let newCoverFile=null;
let newAvatarFile=null;
//========================================
// LOADING
//========================================

function showLoading(){

loadingOverlay.classList.remove("hidden");

}

function hideLoading(){

loadingOverlay.classList.add("hidden");

}


//========================================
// TOAST
//========================================

function showToast(message){

toast.textContent=message;

toast.classList.add("show");

setTimeout(()=>{

toast.classList.remove("show");

},2500);

}


//========================================
// AUTH
//========================================

onAuthStateChanged(auth,async(user)=>{

if(!user){

location.href="login.html";

return;

}

currentUser=user;

showLoading();

try{

await loadCurrentUser();

await loadGroup();

await loadMembers();

await loadPosts();

await loadAnalytics();

}
catch(err){

console.error(err);

alert(err.message);

}

hideLoading();

});


//========================================
// LOAD CURRENT USER
//========================================

async function loadCurrentUser(){

const snap=await getDoc(

doc(db,"users",currentUser.uid)

);

if(!snap.exists()) return;

currentUserData=snap.data();

if(userAvatar){

userAvatar.src=

currentUserData.photo ||

"assets/default-avatar.png";

}

if(createAvatar){

createAvatar.src=

currentUserData.photo ||

"assets/default-avatar.png";

}

}


//========================================
// LOAD GROUP
//========================================

async function loadGroup(){

const snap = await getDoc(doc(db, "groups", groupId));

if (!snap.exists()) {
    alert("Group not found.");
    return;
}

currentGroup = snap.data();

if(!snap.exists()){

alert("Group not found.");

location.href="groups.html";

return;

}

currentGroup=snap.data();

groupCover.src=

currentGroup.cover ||

"assets/default-cover.jpg";

groupAvatar.src=

currentGroup.avatar ||

"assets/default-group.png";

groupName.textContent=

currentGroup.name;

groupDescription.textContent=

currentGroup.description;

memberCount.textContent=

`${currentGroup.members.length} Members`;

postCount.textContent=

`${currentGroup.posts||0} Posts`;

privacyType.textContent=

currentGroup.privacy;

aboutGroup.textContent=

currentGroup.description;

aboutMembers.textContent=

`${currentGroup.members.length} Members`;

aboutPrivacy.textContent=

currentGroup.privacy+" Group";

if(currentGroup.createdAt){

const date=

currentGroup.createdAt.toDate();

const options={

year:"numeric",

month:"long",

day:"numeric"

};

const formatted=

date.toLocaleDateString(

undefined,

options

);

groupCreated.textContent=

"Created "+formatted;

aboutCreated.textContent=

formatted;

}

const joined=

currentGroup.members.includes(

currentUser.uid

);

joinBtn.textContent=

joined

?

"Leave Group"

:

"Join Group";

if(currentGroup.ownerUid===currentUser.uid){

editGroupBtn.classList.remove("hidden");

analyticsCard.classList.remove("hidden");

}

console.log(currentGroup.cover);
console.log(currentGroup.avatar);

}


//========================================
// JOIN / LEAVE GROUP
//========================================

joinBtn.addEventListener("click", async()=>{

try{

showLoading();

const ref=doc(db,"groups",groupId);

if(currentGroup.members.includes(currentUser.uid)){

await updateDoc(ref,{
members:arrayRemove(currentUser.uid)
});

currentGroup.members=currentGroup.members.filter(
uid=>uid!==currentUser.uid
);

showToast("You left the group.");

}else{

await updateDoc(ref,{
members:arrayUnion(currentUser.uid)
});

currentGroup.members.push(currentUser.uid);

showToast("You joined the group.");

}

await loadGroup();
await loadMembers();
await loadAnalytics();

hideLoading();

}catch(err){

console.error(err);

hideLoading();

alert(err.message);

}

});



//========================================
// LOAD MEMBERS
//========================================

async function loadMembers(){

membersList.innerHTML="";
memberPreview.innerHTML="";

let previewCount=0;

for(const uid of currentGroup.members){

const snap=await getDoc(doc(db,"users",uid));

if(!snap.exists()) continue;

const user=snap.data();

membersList.innerHTML+=`

<div class="memberCard">

<img
src="${user.photo||'assets/default-avatar.png'}">

<div class="memberInfo">

<h4>${user.username}</h4>

<p>${user.displayName||""}</p>

</div>

</div>

`;

if(previewCount<8){

memberPreview.innerHTML+=`

<img
src="${user.photo||'assets/default-avatar.png'}"
title="${user.username}">

`;

previewCount++;

}

}

}



//========================================
// SHARE GROUP
//========================================

shareGroupBtn.addEventListener("click",async()=>{

const url=

location.origin+

"/group.html?id="+groupId;

if(navigator.share){

try{

await navigator.share({

title:currentGroup.name,

text:"Join my CreatorHub Group",

url:url

});

}catch(e){}

}else{

navigator.clipboard.writeText(url);

showToast("Group link copied.");

}

});



//========================================
// INVITE BUTTON
//========================================

inviteBtn.addEventListener("click",()=>{

document

.getElementById("inviteModal")

.classList.remove("hidden");

});



//========================================
// CLOSE INVITE
//========================================

document

.getElementById("closeInviteModal")

.addEventListener("click",()=>{

document

.getElementById("inviteModal")

.classList.add("hidden");

});



//========================================
// LOAD ANALYTICS
//========================================

async function loadAnalytics(){

if(currentGroup.ownerUid!==currentUser.uid){

return;

}

document

.getElementById("analyticsMembers")

.textContent=

currentGroup.members.length;

document

.getElementById("analyticsPosts")

.textContent=

currentGroup.posts||0;

const snapshot=

await getDocs(

query(

collection(db,"groupPosts"),

where("groupId","==",groupId)

)

);

let photos=0;

let videos=0;

let activeUsers=new Set();

snapshot.forEach(docSnap=>{

const post=docSnap.data();

activeUsers.add(post.uid);

if(post.mediaType==="image"){

photos++;

}

if(post.mediaType==="video"){

videos++;

}

});

document

.getElementById("analyticsPhotos")

.textContent=photos;

document

.getElementById("analyticsVideos")

.textContent=videos;

document

.getElementById("analyticsActive")

.textContent=

activeUsers.size;

}



//========================================
// MEMBER SEARCH
//========================================

const inviteSearchInput=

document.getElementById(

"inviteSearchInput"

);

if(inviteSearchInput){

inviteSearchInput.addEventListener(

"input",

filterInviteUsers

);

}

function filterInviteUsers(){

const keyword=

inviteSearchInput.value

.toLowerCase();

document

.querySelectorAll(".inviteUser")

.forEach(item=>{

const name=

item.dataset.name;

item.style.display=

name.includes(keyword)

?

"flex"

:

"none";

});

}


//========================================
// OWNER CONTROLS
//========================================

const editGroupModal =
document.getElementById("editGroupModal");

const editGroupForm =
document.getElementById("editGroupForm");

const editGroupName =
document.getElementById("editGroupName");

const editGroupDescription =
document.getElementById("editGroupDescription");

const editGroupPrivacy =
document.getElementById("editGroupPrivacy");

const closeEditGroup =
document.getElementById("closeEditGroup");

const changeCoverBtn =
document.getElementById("changeCoverBtn");

const editcoverInput =
document.getElementById("editcoverInput");

const changeAvatarBtn =
document.getElementById("changeAvatarBtn");

const editavatarInput =
document.getElementById("editavatarInput");



//========================================
// SHOW OWNER BUTTONS
//========================================

if (
    currentGroup &&
    currentGroup.ownerUid &&
    currentUser &&
    currentGroup.ownerUid === currentUser.uid
){
    editGroupBtn.classList.remove("hidden");
    changeCoverBtn.classList.remove("hidden");
    changeAvatarBtn.classList.remove("hidden");
}

//========================================
// OPEN EDIT MODAL
//========================================

editGroupBtn.onclick=()=>{

    editGroupName.value=currentGroup.name;

    editGroupDescription.value=currentGroup.description;

    editGroupPrivacy.value=currentGroup.privacy;

    editCoverPreview.src=
        currentGroup.cover||
        "assets/default-cover.jpg";

    editAvatarPreview.src=
        currentGroup.avatar||
        "assets/default-group.png";

    newCoverFile=null;
    newAvatarFile=null;

    editGroupModal.classList.remove("hidden");

};




editCoverInput.onchange = async () => {

    const file = editCoverInput.files[0];
    if(!file) return;

    showLoading();

    try{

        const upload = await uploadToCloudinary(file);

        console.log(upload);

        await updateDoc(doc(db,"groups",groupId),{
            cover: upload.secure_url
        });

        await loadGroup();

        editCoverPreview.src = upload.secure_url;

        showToast("Cover updated.");

    }catch(err){

        console.error(err);

    }

    hideLoading();

};


editAvatarInput.onchange = async () => {

    const file = editAvatarInput.files[0];
    if(!file) return;

    showLoading();

    try{

        const upload = await uploadToCloudinary(file);

        console.log(upload);

        await updateDoc(doc(db,"groups",groupId),{
            avatar: upload.secure_url
        });

        await loadGroup();

        editAvatarPreview.src = upload.secure_url;

        showToast("Group photo updated.");

    }catch(err){

        console.error(err);

    }

    hideLoading();

};



//========================================
// CLOSE EDIT MODAL
//========================================

closeEditGroup.onclick=()=>{

editGroupModal.classList.add("hidden");

};


//========================================
// SAVE GROUP DETAILS
//========================================

editGroupForm.addEventListener("submit",async(e)=>{

e.preventDefault();

showLoading();

await updateDoc(

doc(db,"groups",groupId),

{

name:editGroupName.value.trim(),

description:editGroupDescription.value.trim(),

privacy:editGroupPrivacy.value,

updatedAt:serverTimestamp()

}

);

editGroupModal.classList.add("hidden");

showToast("Group updated.");

await loadGroup();

hideLoading();

});



//========================================
// CHANGE COVER
//========================================

changeCoverBtn.onclick=()=>{

editcoverInput.click();

};


editCoverInput.onchange = async () => {

    const file = editCoverInput.files[0];
    if(!file) return;

    showLoading();

    try{

        const upload = await uploadToCloudinary(file);

        

        await updateDoc(doc(db,"groups",groupId),{
            cover: upload.secure_url
        });

        await loadGroup();

        editCoverPreview.src = upload.secure_url;

        showToast("Cover updated.");

    }catch(err){

        console.error(err);

    }

    hideLoading();

};


//========================================
// CHANGE AVATAR
//========================================

changeAvatarBtn.onclick=()=>{

editavatarInput.click();

};


editAvatarInput.onchange = async () => {

    const file = editAvatarInput.files[0];
    if(!file) return;

    showLoading();

    try{

        const upload = await uploadToCloudinary(file);

        

        await updateDoc(doc(db,"groups",groupId),{
            avatar: upload.secure_url
        });

        await loadGroup();

        editAvatarPreview.src = upload.secure_url;

        showToast("Group photo updated.");

    }catch(err){

        console.error(err);

    }

    hideLoading();

};


//========================================
// CLOUDINARY
//========================================

async function uploadToCloudinary(file){

    const fd = new FormData();

    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: fd
        }
    );

    return await res.json();

}




//========================================
// CLICK OUTSIDE MODAL
//========================================

window.addEventListener("click",(e)=>{

if(e.target===editGroupModal){

editGroupModal.classList.add("hidden");

}

});




//========================================
// ESC CLOSE MODAL
//========================================

document.addEventListener("keydown",(e)=>{

if(e.key==="Escape"){

editGroupModal.classList.add("hidden");

}

});



//========================================
// POST COMPOSER
//========================================

const postComposerModal =
document.getElementById("postComposerModal");

const openPostComposer =
document.getElementById("openPostComposer");

const closeComposer =
document.getElementById("closeComposer");

const groupPostForm =
document.getElementById("groupPostForm");

const postTitle =
document.getElementById("postTitle");

const postDescription =
document.getElementById("postDescription");

const postMedia =
document.getElementById("postMedia");

const anonymousPost =
document.getElementById("anonymousPost");

const disableComments =
document.getElementById("disableComments");

const photoPostBtn =
document.getElementById("photoPostBtn");

const videoPostBtn =
document.getElementById("videoPostBtn");

let selectedMedia=null;


//========================================
// OPEN COMPOSER
//========================================



openPostComposer.onclick=()=>{

postComposerModal.classList.remove("hidden");

};

photoPostBtn.onclick=()=>{

postComposerModal.classList.remove("hidden");

postMedia.click();

};

videoPostBtn.onclick=()=>{

postComposerModal.classList.remove("hidden");

postMedia.click();

};


//========================================
// CLOSE COMPOSER
//========================================

closeComposer.onclick=()=>{

postComposerModal.classList.add("hidden");

groupPostForm.reset();

selectedMedia=null;

};

window.addEventListener("click",(e)=>{

if(e.target===postComposerModal){

closeComposer.click();

}

});


//========================================
// STORE MEDIA
//========================================

postMedia.onchange=()=>{

selectedMedia=postMedia.files[0];

};


//========================================
// CREATE POST
//========================================

groupPostForm.addEventListener("submit",async(e)=>{

e.preventDefault();

showLoading();

let mediaUrl="";

let mediaType="";

if(selectedMedia){

const upload=

await uploadToCloudinary(selectedMedia);

mediaUrl=upload.secure_url;

mediaType=upload.resource_type;

}

const postId=crypto.randomUUID();

await setDoc(

doc(db,"groupPosts",postId),

{

postId,

groupId,

uid:currentUser.uid,

username:

anonymousPost.checked

?

"Anonymous"

:

currentUserData.username,

userPhoto:

anonymousPost.checked

?

"assets/default-avatar.png"

:

currentUserData.photo,

title:postTitle.value.trim(),

description:postDescription.value.trim(),

mediaUrl,

mediaType,

allowComments:

!disableComments.checked,

likes:0,

shares:0,

views:0,

comments:0,

likedBy:[],

createdAt:serverTimestamp()

}

);

await updateDoc(

doc(db,"groups",groupId),

{

posts:increment(1),

updatedAt:serverTimestamp()

}

);

groupPostForm.reset();

selectedMedia=null;

postComposerModal.classList.add("hidden");

await loadPosts();

await loadGroup();

hideLoading();

showToast("Post published.");

});


//========================================
// LOAD POSTS
//========================================

async function loadPosts(){

groupPosts=[];

groupPostsContainer.innerHTML="";

const q=query(

collection(db,"groupPosts"),

where("groupId","==",groupId),

orderBy("createdAt","desc")

);

const snapshot=await getDocs(q);

snapshot.forEach(docSnap=>{

const post=docSnap.data();

groupPosts.push(post);

renderPost(post);

});

}


//========================================
// RENDER POST
//========================================

function renderPost(post){

groupPostsContainer.innerHTML += `

<div class="groupPostCard"
onclick="openPost('${post.postId}')">

<div class="postHeader">

<img
src="${post.userPhoto}"
class="postAvatar">

<div>

<h4>${post.username}</h4>

<small>${formatTime(post.createdAt)}</small>

</div>

</div>

<h3>${post.title || ""}</h3>

<p class="postPreview">
${post.description}
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
class="likeBtn"
data-id="${post.postId}">
👍 Like
</button>

<button
class="commentBtn"
data-id="${post.postId}">
💬 Comment
</button>

<button
class="shareBtn"
data-id="${post.postId}">
↗ Share
</button>

</div>

</div>

`;

}





window.openPost = function(postId){

location.href =
`group-post.html?id=${postId}`;

};



//========================================
// FORMAT TIME
//========================================

function formatTime(timestamp){

if(!timestamp) return "Just now";

const date=timestamp.toDate();

return date.toLocaleString();

}


//========================================
// RENDER IMAGE/VIDEO
//========================================

function renderMedia(post){

if(!post.mediaUrl){

return "";

}

if(post.mediaType==="image"){

return `

<img

class="postImage"

src="${post.mediaUrl}">

`;

}

return `

<video

class="postVideo"

controls>

<source src="${post.mediaUrl}">

</video>

`;

}



//========================================
// POST ACTIONS
//========================================

document.addEventListener("click",async(e)=>{


//========================================
// OPEN POST
//========================================
const content = e.target.closest(".groupPostCard");

if(content){

    const id = content.querySelector(".likeBtn").dataset.id;

    location.href = `group-post.html?id=${id}`;

}


//========================================
// LIKE
//========================================

if(e.target.classList.contains("likeBtn")){

e.stopPropagation();

const postId=e.target.dataset.id;

const ref=doc(db,"groupPosts",postId);

const snap=await getDoc(ref);

const post=snap.data();

const liked=post.likedBy?.includes(currentUser.uid);

if(liked){

await updateDoc(ref,{

likedBy:arrayRemove(currentUser.uid),

likes:increment(-1)

});

showToast("Like removed.");

}else{

await updateDoc(ref,{

likedBy:arrayUnion(currentUser.uid),

likes:increment(1)

});

showToast("Post liked.");

}

loadPosts();

}


//========================================
// SHARE
//========================================

if(e.target.classList.contains("shareBtn")){

e.stopPropagation();

const id=e.target.dataset.id;

const ref=doc(db,"groupPosts",id);

await updateDoc(ref,{

shares:increment(1)

});

const url=

location.origin+

"/group.html?id="+groupId+

"&post="+id;

if(navigator.share){

try{

await navigator.share({

title:currentGroup.name,

text:"Check this group post",

url:url

});

}catch(err){}

}else{

navigator.clipboard.writeText(url);

showToast("Link copied.");

}

loadPosts();

}


//========================================
// DELETE POST
//========================================

if(e.target.classList.contains("deleteBtn")){

e.stopPropagation();

const ok=confirm(

"Delete this post?"

);

if(!ok) return;

const id=e.target.dataset.id;

await deleteDoc(

doc(db,"groupPosts",id)

);

await updateDoc(

doc(db,"groups",groupId),

{

posts:increment(-1)

}

);

showToast("Post deleted.");

loadPosts();

loadGroup();

}


//========================================
// COMMENT
//========================================

if(e.target.classList.contains("commentBtn")){

e.stopPropagation();

const id=e.target.dataset.id;

openCommentModal(id);

}

});



//========================================
// COMMENT MODAL
//========================================

function openCommentModal(postId){

let modal=

document.getElementById("commentModal");

if(!modal){

modal=document.createElement("div");

modal.id="commentModal";

modal.className="modal";

modal.innerHTML=`

<div class="modalContent">

<div class="modalHeader">

<h2>Comments</h2>

<button id="closeComments">

×

</button>

</div>

<div id="commentsList"></div>




<div class="commentInput">
    <img
        src="${currentUserData.photo}"
        class="commentInputAvatar">

    <input
        id="commentText"
        placeholder="Write a comment...">

    <button id="sendComment">
        Send
    </button>
</div>

</div>

`;

document.body.appendChild(modal);

}

modal.classList.remove("hidden");

loadComments(postId);

document

.getElementById("closeComments")

.onclick=()=>{

modal.classList.add("hidden");

};

document

.getElementById("sendComment")

.onclick=()=>{

sendComment(postId);

};

}



//========================================
// LOAD COMMENTS
//========================================

async function loadComments(postId){

const list=

document.getElementById("commentsList");

list.innerHTML="";

const q=query(

collection(db,"groupComments"),

where("postId","==",postId),

orderBy("createdAt","asc")

);

const snapshot=

await getDocs(q);

snapshot.forEach(docSnap=>{

const c=docSnap.data();

list.innerHTML+=`

<div class="commentItem">

<img

src="${c.userPhoto}"

class="commentAvatar">

<div>

<b>${c.username}</b>

<p>${c.comment}</p>

<small>

${formatTime(c.createdAt)}

</small>

</div>

</div>

`;

});

}



//========================================
// SEND COMMENT
//========================================

async function sendComment(postId){

const input=

document.getElementById("commentText");

const text=input.value.trim();

if(!text) return;

await setDoc(

doc(

collection(db,"groupComments")

),

{

postId,

uid:currentUser.uid,

username:currentUserData.username,

userPhoto:currentUserData.photo,

comment:text,

createdAt:serverTimestamp()

}

);

await updateDoc(

doc(db,"groupPosts",postId),

{

comments:increment(1)

}

);

input.value="";

loadComments(postId);

loadPosts();

showToast("Comment added.");

}


//========================================
// PIN POST
//========================================

async function pinPost(postId){

if(currentGroup.ownerUid!==currentUser.uid){

return;

}

await updateDoc(

doc(db,"groups",groupId),

{

pinnedPost:postId

}

);

showToast("Post pinned.");

loadGroup();

}



//========================================
// UNPIN POST
//========================================

async function unpinPost(){

await updateDoc(

doc(db,"groups",groupId),

{

pinnedPost:""

}

);

showToast("Pinned post removed.");

loadGroup();

}




//========================================
// FACEBOOK REACTIONS
//========================================

const reactions = [
"👍",
"❤️",
"😂",
"😮",
"😢",
"😡"
];

document.addEventListener("mouseover",(e)=>{

if(!e.target.classList.contains("likeBtn")) return;

const btn=e.target;

if(btn.querySelector(".reactionPopup")) return;

const popup=document.createElement("div");

popup.className="reactionPopup";

reactions.forEach(icon=>{

const span=document.createElement("span");

span.textContent=icon;

span.onclick=async()=>{

const postId=btn.dataset.id;

await updateDoc(

doc(db,"groupPosts",postId),

{

[`reactions.${currentUser.uid}`]:icon

}

);

popup.remove();

showToast("Reaction added.");

loadPosts();

};

popup.appendChild(span);

});

btn.appendChild(popup);

});

document.addEventListener("mouseleave",(e)=>{

if(e.target.classList.contains("likeBtn")){

const popup=e.target.querySelector(".reactionPopup");

if(popup){

popup.remove();

}

}

});


//========================================
// REPLY TO COMMENTS
//========================================

async function sendReply(commentId,text){

await setDoc(

doc(collection(db,"groupReplies")),

{

commentId,

uid:currentUser.uid,

username:currentUserData.username,

userPhoto:currentUserData.photo,

reply:text,

createdAt:serverTimestamp()

}

);

showToast("Reply sent.");

}



//========================================
// EDIT POST
//========================================

async function editPost(postId){

const snap=await getDoc(

doc(db,"groupPosts",postId)

);

const post=snap.data();

const title=prompt(

"Edit title",

post.title

);

if(title===null) return;

const body=prompt(

"Edit description",

post.description

);

if(body===null) return;

await updateDoc(

doc(db,"groupPosts",postId),

{

title,

description:body,

edited:true,

editedAt:serverTimestamp()

}

);

showToast("Post updated.");

loadPosts();

}



//========================================
// PINNED POST
//========================================

async function renderPinnedPost(){

if(!currentGroup.pinnedPost){

document

.getElementById("announcementCard")

.classList.add("hidden");

return;

}

const snap=await getDoc(

doc(db,"groupPosts",currentGroup.pinnedPost)

);

if(!snap.exists()) return;

const post=snap.data();

document

.getElementById("announcementCard")

.classList.remove("hidden");

document

.getElementById("announcementTitle")

.textContent=

post.title;

document

.getElementById("announcementBody")

.textContent=

post.description;

}



//========================================
// GROUP NOTIFICATIONS
//========================================

async function notifyMembers(postId,title){

for(const uid of currentGroup.members){

if(uid===currentUser.uid) continue;

await setDoc(

doc(collection(db,"notifications")),

{

uid,

type:"groupPost",

groupId,

postId,

title:

currentGroup.name,

message:

`${currentUserData.username} added a new post: ${title}`,

read:false,

createdAt:serverTimestamp()

}

);

}

}



//========================================
// PHOTO GALLERY
//========================================

async function loadPhotos(){

const grid=

document.getElementById("photoGrid");

grid.innerHTML="";

const q=query(

collection(db,"groupPosts"),

where("groupId","==",groupId)

);

const snapshot=await getDocs(q);

snapshot.forEach(docSnap=>{

const post=docSnap.data();

if(post.mediaType==="image"){

grid.innerHTML+=`

<img

src="${post.mediaUrl}"

class="galleryPhoto">

`;

}

});

}



//========================================
// VIDEO GALLERY
//========================================

async function loadVideos(){

const grid=

document.getElementById("videoGrid");

grid.innerHTML="";

const q=query(

collection(db,"groupPosts"),

where("groupId","==",groupId)

);

const snapshot=await getDocs(q);

snapshot.forEach(docSnap=>{

const post=docSnap.data();

if(post.mediaType==="video"){

grid.innerHTML+=`

<video

controls

class="galleryVideo">

<source

src="${post.mediaUrl}">

</video>

`;

}

});

}



const sections = {
    discussion: "discussionSection",
    featured: "featuredSection",
    members: "membersSection",
    photos: "photosSection",
    videos: "videosSection",
    about: "aboutSection"
};

document.querySelectorAll(".groupTab").forEach(tab => {

    tab.addEventListener("click", () => {

        // Active tab
        document.querySelectorAll(".groupTab")
        .forEach(btn => btn.classList.remove("active"));

        tab.classList.add("active");

        // Scroll
        const section = document.getElementById(
            sections[tab.dataset.tab]
        );

        if(section){

            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    });

});




//========================================
// LOAD EVERYTHING
//========================================

async function refreshGroupPage(){

await loadGroup();

await loadMembers();

await loadPosts();

await loadAnalytics();

await renderPinnedPost();

await loadPhotos();

await loadVideos();

}



