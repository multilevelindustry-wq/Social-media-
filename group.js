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
serverTimestamp,
arrayUnion,
arrayRemove,
increment
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const CLOUD_NAME="diqrjgobk";
const UPLOAD_PRESET="starcode";

const params=new URLSearchParams(location.search);

const groupId=params.get("id");

let currentUser;
let currentGroup;
let currentUserData;


const joinBtn=document.getElementById("joinBtn");

const groupPostForm=document.getElementById("groupPostForm");

const groupPosts=document.getElementById("groupPosts");

const membersList=document.getElementById("membersList");

const postMedia=document.getElementById("postMedia");


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

document.getElementById("userAvatar").src=currentUserData.photo;

await loadGroup();

await loadMembers();

await loadPosts();

});



async function loadGroup(){

const snap=await getDoc(

doc(db,"groups",groupId)

);

currentGroup=snap.data();

document.getElementById("groupCover").src=

currentGroup.cover||

"assets/default-cover.jpg";

document.getElementById("groupName").textContent=

currentGroup.name;

document.getElementById("groupDescription").textContent=

currentGroup.description;

document.getElementById("memberCount").textContent=

`${currentGroup.members.length} Members`;

document.getElementById("postCount").textContent=

`${currentGroup.posts} Posts`;

document.getElementById("privacyType").textContent=

currentGroup.privacy;

joinBtn.textContent=

currentGroup.members.includes(currentUser.uid)

?

"Leave Group"

:

"Join Group";

}



joinBtn.onclick=async()=>{

const ref=doc(db,"groups",groupId);

if(currentGroup.members.includes(currentUser.uid)){

await updateDoc(ref,{

members:arrayRemove(currentUser.uid)

});

}else{

await updateDoc(ref,{

members:arrayUnion(currentUser.uid)

});

}

await loadGroup();

await loadMembers();

};





groupPostForm.addEventListener("submit",async(e)=>{

e.preventDefault();

let mediaUrl="";

let mediaType="";

if(postMedia.files.length){

const upload=

await uploadToCloudinary(postMedia.files[0]);

mediaUrl=upload.secure_url;

mediaType=upload.resource_type;

}

const postId=crypto.randomUUID();






async function loadMembers(){

membersList.innerHTML="";

for(const uid of currentGroup.members){

const snap=await getDoc(

doc(db,"users",uid)

);

const user=snap.data();

membersList.innerHTML+=`

<div class="memberCard">

<img src="${user.photo}">

<div>

<h4>${user.username}</h4>

<p>${user.email}</p>

</div>

</div>

`;

}

}


await setDoc(

doc(db,"groupPosts",postId),

{

postId,

groupId,

uid:currentUser.uid,

username:currentUserData.username,

userPhoto:currentUserData.photo,

title:postTitle.value,

description:postDescription.value,

mediaUrl,

mediaType,

likes:0,

comments:0,

views:0,

createdAt:serverTimestamp()

}

);

await updateDoc(

doc(db,"groups",groupId),

{

posts:increment(1)

});

groupPostForm.reset();

loadPosts();

loadGroup();

});



async function loadPosts(){

groupPosts.innerHTML="";

const q=query(

collection(db,"groupPosts"),

where("groupId","==",groupId)

);

const snapshot=await getDocs(q);

snapshot.forEach(docSnap=>{

const post=docSnap.data();

groupPosts.innerHTML+=`

<div class="groupPostCard">

${renderMedia(post)}

<div class="groupPostContent">

<h3>${post.title}</h3>

<p>${post.description}</p>

<div class="groupPostMeta">

<span>👁 ${post.views}</span>

<span>❤️ ${post.likes}</span>

</div>

</div>

</div>

`;

});

}



function renderMedia(post){

if(!post.mediaUrl){

return "";

}

if(post.mediaType==="image"){

return `<img src="${post.mediaUrl}">`;

}

return `

<video controls>

<source src="${post.mediaUrl}">

</video>

`;

}

async function uploadToCloudinary(file){

const fd=new FormData();

fd.append("file",file);

fd.append("upload_preset",UPLOAD_PRESET);

const res=await fetch(

`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,

{

method:"POST",

body:fd

}

);

return await res.json();

}


