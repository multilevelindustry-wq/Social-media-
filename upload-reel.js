import { auth, db } from "./firebase.js";

import { onAuthStateChanged }

from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {

doc,

getDoc,

collection,

addDoc,

serverTimestamp

}

from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const CLOUD_NAME="diqrjgobk";

const UPLOAD_PRESET="starcode";

const preview=document.getElementById("previewVideo");

const fileInput=document.getElementById("videoFile");

const caption=document.getElementById("caption");

const uploadBtn=document.getElementById("uploadBtn");

let currentUser;

let currentUserData;

onAuthStateChanged(auth,async(user)=>{

if(!user){

location.href="login.html";

return;

}

currentUser=user;

const snap=await getDoc(

doc(db,"users",user.uid)

);

currentUserData=snap.data();

});

fileInput.addEventListener("change",()=>{

const file=fileInput.files[0];

if(!file) return;

preview.src=URL.createObjectURL(file);

preview.style.display="block";

});

uploadBtn.addEventListener("click",async()=>{

if(!fileInput.files.length){

alert("Select a video.");

return;

}

uploadBtn.disabled=true;

uploadBtn.textContent="Uploading...";

const upload=await uploadVideo(fileInput.files[0]);

await addDoc(collection(db,"reels"),{

uid:currentUser.uid,

username:currentUserData.username,

userPhoto:currentUserData.photo,

videoUrl:upload.secure_url,

caption:caption.value.trim(),

likes:0,
likedBy:[],

comments:0,

shares:0,

views:0,

createdAt:serverTimestamp()

});

alert("Reel uploaded successfully.");

location.href="reels.html";

});

async function uploadVideo(file){

const fd=new FormData();

fd.append("file",file);

fd.append("upload_preset",UPLOAD_PRESET);

const res=await fetch(

`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,

{

method:"POST",

body:fd

}

);

return await res.json();

}