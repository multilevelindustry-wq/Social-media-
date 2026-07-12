/* ==========================================
   CREATORHUB LIVE
   PART 1 - FIREBASE FOUNDATION
========================================== */

"use strict";

/* ==========================================
   FIREBASE
========================================== */

import {
    increment
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import{

doc,
getDoc,
setDoc,
deleteDoc,
collection,
addDoc,
query,
orderBy,
limit,
onSnapshot,
serverTimestamp,
updateDoc,
runTransaction,
serverTimestamp
}from"https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


/* ==========================================
   GIFT COMBO SETTINGS
========================================== */

const COMBO_TIMEOUT = 4000; // 5 seconds
/* ==========================================
   ELEMENTS
========================================== */
const giftAnimationContainer =
document.getElementById("giftAnimationContainer");


const commentsContainer =
document.getElementById("commentsContainer");

const chatInput =
document.getElementById("chatInput");

const liveVideo = document.getElementById("liveVideo");

const creatorAvatar = document.getElementById("creatorAvatar");

const creatorName = document.getElementById("creatorName");

const followBtn = document.getElementById("followBtn");

const viewerCount = document.getElementById("viewerCount");

const onlineUsers = document.getElementById("onlineUsers");

const likesCount = document.getElementById("likesCount");

const loadingScreen = document.getElementById("loadingScreen");

/* ==========================================
   VARIABLES
========================================== */




/* ==========================================
   GIFT QUEUE
========================================== */

const giftQueue = [];

let playingGift = false;

let currentUser = null;

let streamId = null;

let streamData = null;

let hostData = null;

/* ==========================================
   GET STREAM ID
========================================== */

const params = new URLSearchParams(window.location.search);

streamId = params.get("stream");

if(!streamId){

    alert("Invalid live stream.");

    location.href = "index.html";

}

/* ==========================================
   AUTH
========================================== */

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        location.href="login.html";

        return;

    }

    currentUser = user;

    await loadLiveStream();

});


/* ==========================================
   LOAD LIVE STREAM
========================================== */

async function loadLiveStream(){

    try{

        const streamRef = doc(db,"liveStreams",streamId);

        const streamSnap = await getDoc(streamRef);

        if(!streamSnap.exists()){

            alert("Live stream not found.");

            history.back();

            return;

        }

        streamData = streamSnap.data();

        if(streamData.isLive !== true){

            alert("This live has ended.");

            history.back();

            return;

        }

        await loadHost(streamData.hostId);

    }

    catch(error){

        console.error(error);

    }

}




/* ==========================================
   LOAD HOST
========================================== */

async function loadHost(hostId){

    try{

        const hostRef = doc(db,"users",hostId);

        const hostSnap = await getDoc(hostRef);

        if(!hostSnap.exists()) return;

        hostData = hostSnap.data();

        creatorName.textContent =

            hostData.displayName || "Creator";

        creatorAvatar.src =

            hostData.photoURL ||

            "assets/default-avatar.png";

        loadingScreen.style.display="none";
        
        await joinStream();
        listenForComments();
        listenForHearts();
        listenForHeartEvents();
        listenForGifts();

    }

    catch(error){

        console.error(error);

    }

}





/* ==========================================
   JOIN STREAM
========================================== */

async function joinStream(){

    try{

        const viewerRef = doc(

            db,

            "liveStreams",

            streamId,

            "viewers",

            currentUser.uid

        );

        await setDoc(viewerRef,{

            uid: currentUser.uid,

            username:

                currentUser.displayName ||

                "Anonymous",

            photoURL:

                currentUser.photoURL ||

                "assets/default-avatar.png",

            joinedAt: serverTimestamp()

        });

        listenForViewers();

    }

    catch(error){

        console.error(error);

    }

}



/* ==========================================
   LIVE VIEWER COUNT
========================================== */

function listenForViewers(){

    const viewersRef = collection(

        db,

        "liveStreams",

        streamId,

        "viewers"

    );

    onSnapshot(viewersRef,(snapshot)=>{

        const total = snapshot.size;

        viewerCount.textContent = total;

        onlineUsers.textContent = total;

    });

}




/* ==========================================
   LEAVE STREAM
========================================== */

async function leaveStream(){

    try{

        const viewerRef = doc(

            db,

            "liveStreams",

            streamId,

            "viewers",

            currentUser.uid

        );

        await deleteDoc(viewerRef);

    }

    catch(error){

        console.error(error);

    }

}




/* ==========================================
   CLEANUP
========================================== */

window.addEventListener("beforeunload",()=>{

    leaveStream();

});



/* ==========================================
   SEND COMMENT
========================================== */

async function sendComment(){

const message=

chatInput.value.trim();

if(message==="") return;

try{

await addDoc(

collection(

db,

"liveStreams",

streamId,

"comments"

),

{

uid:currentUser.uid,

username:

currentUser.displayName||

"Anonymous",

photoURL:

currentUser.photoURL||

"assets/default-avatar.png",

message,

createdAt:

serverTimestamp()

}

);

chatInput.value="";

}catch(error){

console.error(error);

}

}









/* ==========================================
   REALTIME COMMENTS
========================================== */

function listenForComments(){

const commentsQuery=query(

collection(

db,

"liveStreams",

streamId,

"comments"

),

orderBy(

"createdAt",

"asc"

),

limit(100)

);

onSnapshot(

commentsQuery,

(snapshot)=>{

commentsContainer.innerHTML="";

snapshot.forEach((doc)=>{

renderComment(doc.data());

});

commentsContainer.scrollTop=

commentsContainer.scrollHeight;

}

);

}


chatInput.addEventListener(

"keypress",

(e)=>{

if(e.key==="Enter"){

sendComment();

}

}

);


/* ==========================================
   RENDER COMMENT
========================================== */

function renderComment(comment){

const div=

document.createElement("div");

div.className="commentItem";

div.innerHTML=`

<img
src="${comment.photoURL}"
class="commentAvatar">

<div>

<b>

${comment.username}

</b>

<p>

${comment.message}

</p>

</div>

`;

commentsContainer.appendChild(div);

}



/* ==========================================
   HEARTS
========================================== */

const likeBtn =
document.getElementById("likeBtn");

const heartCounter =
document.getElementById("heartCounter");

const floatingHearts =
document.getElementById("floatingHearts");




/* ==========================================
   SEND HEART
========================================== */

likeBtn.addEventListener("click",async()=>{

createHeart();

await sendHeart();

});



/* ==========================================
   SAVE HEART
========================================== */

async function sendHeart(){

    try{

        /* ---------- Permanent Counter ---------- */

        const shard = Math.floor(

            Math.random()*HEART_SHARDS

        ).toString();

        await setDoc(

            doc(

                db,

                "liveStreams",

                streamId,

                "counters",

                "hearts",

                "shards",

                shard

            ),

            {

                count:increment(1)

            },

            {

                merge:true

            }

        );

        /* ---------- Floating Heart ---------- */

        await addDoc(

            collection(

                db,

                "liveStreams",

                streamId,

                "heartEvents"

            ),

            {

                uid:currentUser.uid,

                username:

                currentUser.displayName,

                photoURL:

                currentUser.photoURL,

                createdAt:

                serverTimestamp()

            }

        );

    }

    catch(error){

        console.error(error);

    }

}



/* ==========================================
   HEART COUNT
========================================== */

function listenForHearts(){

    const shardsRef = collection(
        db,
        "liveStreams",
        streamId,
        "counters",
        "hearts",
        "shards"
    );

    onSnapshot(shardsRef,(snapshot)=>{

        let total = 0;

        snapshot.forEach(doc=>{

            total += doc.data().count || 0;

        });

        heartCounter.textContent = formatNumber(total);

        likesCount.textContent = formatNumber(total);

    });

}




function listenForHeartEvents(){

const q=query(

collection(

db,

"liveStreams",

streamId,

"heartEvents"

),

orderBy(

"createdAt",

"desc"

),

limit(30)

);

onSnapshot(q,(snapshot)=>{

snapshot.docChanges().forEach(change=>{

if(change.type==="added"){

createHeart();

}

});

});

}





async function createHeartShards(){

    for(let i=0;i<HEART_SHARDS;i++){

        await setDoc(

            doc(
                db,
                "liveStreams",
                streamId,
                "counters",
                "hearts",
                "shards",
                i.toString()
            ),

            {
                count:0
            }

        );

    }

}



/* ==========================================
   FLOATING HEART
========================================== */

function createHeart(){

const heart=

document.createElement("div");

heart.className=

"floatingHeart";

const hearts=[

"❤️",

"💖",

"💕",

"💜",

"💙",

"💚",

"🧡",

"💛"

];

heart.textContent=

hearts[

Math.floor(

Math.random()*hearts.length

)

];

heart.style.right=

(20+Math.random()*40)+"px";

heart.style.fontSize=

(26+Math.random()*16)+"px";

floatingHearts.appendChild(heart);

setTimeout(()=>{

heart.remove();

},3000);

}



/* ==========================================
   SAVE GIFT EVENT
========================================== */

async function saveGiftEvent(gift){

await addDoc(

collection(

db,

"liveStreams",

streamId,

"gifts"

),

{

senderId:

currentUser.uid,

senderName:

currentUser.displayName,

senderPhoto:

currentUser.photoURL,

hostId:

streamData.hostId,

giftId:

gift.id,

giftName:

gift.name,

giftEmoji:

gift.emoji,

coins:

gift.coins,

createdAt:

serverTimestamp()

}

);

}



/* ==========================================
   SEND GIFT
========================================== */

async function sendGift(gift){

try{

const senderRef=

doc(db,"users",currentUser.uid);

const hostRef=

doc(db,"users",streamData.hostId);

await runTransaction(db,async(transaction)=>{

const sender=

await transaction.get(senderRef);

const host=

await transaction.get(hostRef);

if(!sender.exists()){

throw "Sender not found";

}

if(!host.exists()){

throw "Host not found";

}

const senderData=

sender.data();

const hostData=

host.data();

const balance=

senderData.coins||0;

if(balance<gift.coins){

throw "Not enough coins";

}

transaction.update(senderRef,{

coins:

balance-gift.coins,

totalSent:

(senderData.totalSent||0)

+gift.coins

});

transaction.update(hostRef,{

diamonds:

(hostData.diamonds||0)

+gift.coins,

totalReceived:

(hostData.totalReceived||0)

+gift.coins

});

});

await saveGiftEvent(gift);

giftPanel.classList.add("hidden");

showGiftAnimation(gift);

}catch(error){

alert(error);

console.error(error);

}

await updateGiftCombo(gift);

}






/* ==========================================
   GIFT BUTTONS
========================================== */

document.querySelectorAll(".giftItem").forEach(button=>{

button.addEventListener("click",()=>{

const gift={

id:button.dataset.gift,

name:button.querySelector("h4").textContent,

emoji:button.querySelector(".giftEmoji").textContent,

coins:Number(button.dataset.coins)

};

sendGift(gift);

});

});




/* ==========================================
   REALTIME GIFTS
========================================== */

function listenForGifts(){

const giftsQuery=query(

collection(

db,

"liveStreams",

streamId,

"gifts"

),

orderBy(

"createdAt",

"desc"

),

limit(20)

);

onSnapshot(giftsQuery,(snapshot)=>{

snapshot.docChanges().forEach(change=>{

if(change.type==="added"){



/* ==========================================
   SHOW GIFT
========================================== */

function showGift(gift){

const card=document.createElement("div");

card.className="giftToast";

card.innerHTML=`

<img
src="${gift.senderPhoto}"
class="giftAvatar">

<div>

<b>

${gift.senderName}

</b>

<p>

sent

${gift.giftEmoji}

${gift.giftName}

</p>

</div>

`;

giftOverlay.appendChild(card);

showGiftAnimation(gift);

setTimeout(()=>{

card.remove();

},4500);

}


showGift(change.doc.data());

}

});

});

}





function showGiftCombo(combo){

    const toast = document.createElement("div");

    toast.className = "comboToast";

    if(combo.combo >= 10){

        toast.classList.add("comboGold");

    }

    if(combo.combo >= 50){

        toast.classList.add("comboLegend");

    }

    toast.innerHTML = `
        <img src="${combo.senderPhoto}" class="giftAvatar">

        <div>

            <b>${combo.senderName}</b>

            <p>${combo.giftEmoji} ${combo.giftName} ×${combo.combo}</p>

        </div>
    `;

    giftOverlay.appendChild(toast);

    setTimeout(()=>{

        toast.remove();

    },2500);

}




function listenForGiftCombos(){

const combos=

collection(

db,

"liveStreams",

streamId,

"giftCombos"

);

onSnapshot(combos,(snapshot)=>{

snapshot.docChanges().forEach(change=>{

if(change.type==="added"||

change.type==="modified"){

showGiftCombo(change.doc.data());

}

});

});

}



async function updateGiftCombo(gift){

    const comboRef = doc(
        db,
        "liveStreams",
        streamId,
        "giftCombos",
        currentUser.uid
    );

    await runTransaction(db, async(transaction)=>{

        const comboSnap = await transaction.get(comboRef);

        const now = Date.now();

        if(!comboSnap.exists()){

            transaction.set(comboRef,{
                giftId: gift.id,
                giftName: gift.name,
                giftEmoji: gift.emoji,
                combo: 1,
                lastSent: now,
                senderName: currentUser.displayName,
                senderPhoto: currentUser.photoURL
            });

            return;

        }

        const data = comboSnap.data();

        const expired =
            (now - data.lastSent) > COMBO_TIMEOUT;

        const differentGift =
            data.giftId !== gift.id;

        if(expired || differentGift){

            transaction.set(comboRef,{
                giftId: gift.id,
                giftName: gift.name,
                giftEmoji: gift.emoji,
                combo: 1,
                lastSent: now,
                senderName: currentUser.displayName,
                senderPhoto: currentUser.photoURL
            });

        }else{

            transaction.update(comboRef,{
                combo: data.combo + 1,
                lastSent: now
            });

        }

    });

}





function showGiftAnimation(gift){

    switch(gift.id){

        case "rose":
            animateRose();
            break;

        case "heart":
            animateHeart();
            break;

        case "lion":
            animateLion();
            break;

        case "castle":
            animateCastle();
            break;

        case "universe":
            animateUniverse();
            break;

        case "whale":
            animateWhale();
            break;

        default:
            animateDefault(gift.emoji);

    }

}



function animateDefault(emoji){

    const div=document.createElement("div");

    div.className="giftBig";

    div.textContent=emoji;

    giftAnimationContainer.appendChild(div);

    setTimeout(()=>{

        div.remove();

    },3000);

}


function animateRose(){

    for(let i=0;i<20;i++){

        const rose=document.createElement("div");

        rose.className="roseAnimation";

        rose.textContent="🌹";

        rose.style.left=

        Math.random()*100+"vw";

        rose.style.animationDelay=

        Math.random()+"s";

        giftAnimationContainer.appendChild(rose);

        setTimeout(()=>{

            rose.remove();

        },5000);

    }

}



function animateHeart(){

    for(let i=0;i<40;i++){

        createHeart();

    }

}



function animateLion(){

    const lion=document.createElement("div");

    lion.className="lionAnimation";

    lion.textContent="🦁";

    giftAnimationContainer.appendChild(lion);

    setTimeout(()=>{

        lion.remove();

    },5000);

}





async function playGiftAnimation(gift){

    switch(gift.id){

        case "rose":

            await animateRose();

            break;

        case "lion":

            await animateLion();

            break;

        case "castle":

            await animateCastle();

            break;

        case "universe":

            await animateUniverse();

            break;

        default:

            await animateDefault(gift.emoji);

    }

}



async function playNextGift(){

    if(giftQueue.length===0){

        playingGift=false;

        return;

    }

    playingGift=true;

    const gift=

    giftQueue.shift();

    await playGiftAnimation(gift);

    playNextGift();

}


function enqueueGift(gift){

    giftQueue.push(gift);

    if(!playingGift){

        playNextGift();

    }

}




function animateRose(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}


function animatedonut(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatecoffee(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatetiktok(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animateperfume(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatefingerHeart(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animateheart(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatebear(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatediamond(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatecap(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animategiftBox(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatesunglasses(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatecrown(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatebutterfly(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatelion(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatebouquet(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatecake(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animateyacht(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animateprivateJet(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animateuniverse(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatewhale(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatefireworks(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animateairplane(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatedragon(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatephoenix(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatesportsCar(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animatecastle(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animateunicorn(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}

function animaterocket(){

    return new Promise(resolve=>{

        // animation

        setTimeout(resolve,3000);

    });

}