import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
doc,
getDoc,
updateDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const CLOUD_NAME="diqrjgobk";
const UPLOAD_PRESET="starcode";

const params=new URLSearchParams(location.search);

const postId=params.get("id");

const form=document.getElementById("editForm");

const media=document.getElementById("media");

const preview=document.getElementById("previewContainer");

const saveBtn=document.getElementById("saveBtn");

let currentUser;
let postData;
let selectedFile=null;

onAuthStateChanged(auth,async(user)=>{

if(!user){

location.href="login.html";

return;

}

currentUser=user;

await loadUser();

await loadPost();

});

async function loadUser(){

const snap=await getDoc(

doc(db,"users",currentUser.uid)

);

if(snap.exists()){

document.getElementById("userAvatar").src=snap.data().photo;

}

}

async function loadPost(){

const snap=await getDoc(

doc(db,"posts",postId)

);

if(!snap.exists()){

alert("Post not found.");

location.href="dashboard.html";

return;

}

postData=snap.data();

document.getElementById("title").value=postData.title;

document.getElementById("description").value=postData.description;

document.getElementById("category").value=postData.category;

document.getElementById("hashtags").value=postData.hashtags||"";

document.getElementById("visibility").value=postData.visibility;

showPreview(postData.mediaUrl,postData.mediaType);

}

media.addEventListener("change",(e)=>{

selectedFile=e.target.files[0];

if(!selectedFile) return;

const url=URL.createObjectURL(selectedFile);

if(selectedFile.type.startsWith("image")){

showPreview(url,"image");

}else{

showPreview(url,"video");

}

});

function showPreview(url,type){

preview.innerHTML=

type==="image"

? `<img src="${url}">`

: `<video controls src="${url}"></video>`;

}


form.addEventListener("submit",async(e)=>{

e.preventDefault();

saveBtn.disabled=true;

saveBtn.textContent="Saving...";

let mediaUrl=postData.mediaUrl;

let mediaType=postData.mediaType;

let publicId=postData.cloudinaryPublicId;

if(selectedFile){

const upload=await uploadToCloudinary(selectedFile);

mediaUrl=upload.secure_url;

mediaType=upload.resource_type;

publicId=upload.public_id;

}



await updateDoc(

doc(db,"posts",postId),

{

title:document.getElementById("title").value.trim(),

description:document.getElementById("description").value.trim(),

category:document.getElementById("category").value,

hashtags:document.getElementById("hashtags").value.trim(),

visibility:document.getElementById("visibility").value,

mediaUrl,

mediaType,

cloudinaryPublicId:publicId,

updatedAt:serverTimestamp()

}

);

alert("Post updated successfully.");

location.href="dashboard.html";

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


