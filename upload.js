import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
doc,
getDoc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const CLOUD_NAME="diqrjgobk";

const UPLOAD_PRESET="starcode";

const uploadForm=document.getElementById("uploadForm");

const media=document.getElementById("media");

const previewContainer=document.getElementById("previewContainer");

const publishBtn=document.getElementById("publishBtn");

let currentUser;

let selectedFile=null;


onAuthStateChanged(auth,(user)=>{

if(!user){

location.href="login.html";

return;

}

currentUser=user;

loadAvatar();

});

async function loadAvatar(){

const snap=await getDoc(

doc(db,"users",currentUser.uid)

);

if(snap.exists()){

document.getElementById("userAvatar").src=snap.data().photo;

}

}


media.addEventListener("change",(e)=>{

selectedFile=e.target.files[0];

if(!selectedFile) return;

previewContainer.innerHTML="";

const url=URL.createObjectURL(selectedFile);

if(selectedFile.type.startsWith("image")){

previewContainer.innerHTML=

`<img src="${url}">`;

}else{

previewContainer.innerHTML=

`<video controls src="${url}"></video>`;

}

});


uploadForm.addEventListener("submit",async(e)=>{

e.preventDefault();

publishBtn.disabled=true;

publishBtn.textContent="Uploading...";

try{

const mediaData=await uploadToCloudinary(selectedFile);

await savePost(mediaData);

alert("Post published successfully!");

location.href="dashboard.html";

}catch(err){

console.error(err);

alert(err.message);

publishBtn.disabled=false;

publishBtn.textContent="Publish Post";

}

});


async function uploadToCloudinary(file){

const formData=new FormData();

formData.append("file",file);

formData.append("upload_preset",UPLOAD_PRESET);

const response=await fetch(

`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,

{

method:"POST",

body:formData

}

);

return await response.json();

}




async function savePost(mediaData){

const postId=crypto.randomUUID();

const userSnap=await getDoc(

doc(db,"users",currentUser.uid)

);

const user=userSnap.data();

const title=document.getElementById("title").value.trim();

const description=document.getElementById("description").value.trim();

const content =
document.getElementById("content").value.trim();

const category=document.getElementById("category").value;

const hashtags=document.getElementById("hashtags").value.trim();

const visibility=document.getElementById("visibility").value;

await setDoc(

doc(db,"posts",postId),

{

postId,

uid:currentUser.uid,

username:user.username,

userPhoto:user.photo,

title,

description,

content,

category,

hashtags,

visibility,

mediaUrl:mediaData.secure_url,

mediaType:mediaData.resource_type,

cloudinaryPublicId:mediaData.public_id,

createdAt:serverTimestamp(),

updatedAt:serverTimestamp(),

views:0,

likes:0,

comments:0,

shares:0,

earnings:0

}

);

  }


