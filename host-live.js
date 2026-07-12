"use strict";

/* ==========================================
   FIREBASE
========================================== */

import { auth, db } from "./firebase.js";

import {

doc,
setDoc,
updateDoc,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {

onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


/* ==========================================
   ELEMENTS
========================================== */

const previewVideo = document.getElementById("previewVideo");

const goLiveBtn = document.getElementById("goLiveBtn");

const cameraBtn = document.getElementById("cameraBtn");

const micBtn = document.getElementById("micBtn");

const flipBtn = document.getElementById("flipBtn");

const screenBtn = document.getElementById("screenBtn");

const qualityBtn = document.getElementById("qualityBtn");

const liveTitle = document.getElementById("liveTitle");

const liveCategory = document.getElementById("liveCategory");

const liveStatus = document.getElementById("liveStatus");



/* ==========================================
   STREAM ID
========================================== */

function generateStreamId(){

    return crypto.randomUUID();

}



goLiveBtn.addEventListener("click",()=>{

    if(isLive){

        endLive();

    }else{

        startLive();

    }

});



/* ==========================================
   VARIABLES
========================================== */

let currentUser = null;

let localStream = null;

let videoTrack = null;

let audioTrack = null;

let usingFrontCamera = true;

let streamId = null;

let isLive = false;


/* ==========================================
   AUTH
========================================== */

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        location.href="login.html";

        return;

    }

    currentUser = user;

    await startCamera();

});


/* ==========================================
   CAMERA
========================================== */

async function startCamera(){

try{

localStream=

await navigator.mediaDevices.getUserMedia({

video:{

facingMode:

usingFrontCamera

?

"user"

:

"environment"

},

audio:true

});

previewVideo.srcObject=

localStream;

videoTrack=

localStream.getVideoTracks()[0];

audioTrack=

localStream.getAudioTracks()[0];

}catch(error){

console.error(error);

alert("Unable to access camera.");

}

}



flipBtn.onclick = async()=>{

usingFrontCamera=

!usingFrontCamera;

if(localStream){

localStream.getTracks()

.forEach(track=>track.stop());

}

await startCamera();

};


cameraBtn.onclick=()=>{

videoTrack.enabled=

!videoTrack.enabled;

cameraBtn.style.opacity=

videoTrack.enabled

?

"1"

:

".5";

};



micBtn.onclick=()=>{

audioTrack.enabled=

!audioTrack.enabled;

micBtn.style.opacity=

audioTrack.enabled

?

"1"

:

".5";

};




/* ==========================================
   CREATE LIVE DOCUMENT
========================================== */

async function createLiveDocument(){

const liveRef=

doc(

db,

"liveStreams",

streamId

);

await setDoc(

liveRef,

{

streamId,

hostId:

currentUser.uid,

hostName:

currentUser.displayName||

"Creator",

hostPhoto:

currentUser.photoURL||

"assets/default-avatar.png",

title:

liveTitle.value.trim(),

category:

liveCategory.value,

startedAt:

serverTimestamp(),

status:"live",

viewerCount:0,

heartCount:0,

giftCount:0,

commentCount:0,

shareCount:0,

totalDiamonds:0,

createdAt:

serverTimestamp()

}

);

}


/* ==========================================
   START LIVE
========================================== */

async function startLive(){

try{

if(isLive) return;

const title=

liveTitle.value.trim();

if(title===""){

alert(

"Please enter a live title."

);

return;

}

streamId=

generateStreamId();

await createLiveDocument();

sessionStorage.setItem(

"currentStreamId",

streamId

);



isLive=true;

liveStatus.innerHTML=

"🔴 LIVE";

goLiveBtn.textContent=

"END LIVE";

goLiveBtn.style.background=

"#444";

}catch(error){

console.error(error);

alert(error.message);

}

}





/* ==========================================
   END LIVE
========================================== */

async function endLive(){

try{

const confirmEnd=

confirm(

"Are you sure you want to end this LIVE?"

);

if(!confirmEnd) return;

await updateDoc(

doc(db,"liveStreams",streamId),

{

status:"ended",

endedAt:serverTimestamp()

}

);

stopLocalStream();

isLive=false;

liveStatus.textContent="⚫ NOT LIVE";

goLiveBtn.textContent="🔴 GO LIVE";

goLiveBtn.style.background="#ff0050";

sessionStorage.removeItem(

"currentStreamId"

);

alert("Live ended successfully.");

}catch(error){

console.error(error);

}

}


/* ==========================================
   STOP CAMERA
========================================== */

function stopLocalStream(){

if(!localStream) return;

localStream.getTracks().forEach(track=>{

track.stop();

});

previewVideo.srcObject=null;

}



window.addEventListener("beforeunload",()=>{

if(isLive){

updateDoc(

doc(db,"liveStreams",streamId),

{

status:"ended",

endedAt:serverTimestamp()

}

);

}

stopLocalStream();

});



