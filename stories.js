import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    addDoc,
    query,
    orderBy,
    serverTimestamp,
    increment,
    arrayUnion,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// ===============================
// CLOUDINARY
// ===============================

const CLOUD_NAME = "diqrjgobk";
const UPLOAD_PRESET = "starcode";


// ===============================
// DOM
// ===============================

const storyMedia =
document.getElementById("storyMedia");

const storiesContainer =
document.getElementById("homeStoriesContainer");

const storyViewer =
document.getElementById("storyViewer");

const storyMediaContainer =
document.getElementById("storyMediaContainer");

const storyProgress =
document.getElementById("storyProgress");

const topProfile =
document.getElementById("topProfile");


// ===============================
// VARIABLES
// ===============================

let currentUser = null;
let currentUserData = null;

let stories = [];
let currentIndex = 0;

let progressTimer = null;
let storyTimer = null;

let touchStartX = 0;
let touchEndX = 0;


// ===============================
// AUTH
// ===============================

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        location.href = "login.html";

        return;

    }

    currentUser = user;

    const userSnap = await getDoc(
        doc(db,"users",user.uid)
    );

    if(userSnap.exists()){

        currentUserData = userSnap.data();

    }

    if(topProfile){

        topProfile.src =
        currentUserData?.photo ||
        "assets/default-avatar.png";

    }

    await removeExpiredStories();

    await loadStories();

});


// ===============================
// LOAD STORIES
// ===============================

async function loadStories(){

    stories = [];

    storiesContainer.innerHTML = "";

    const q = query(

        collection(db,"stories"),

        orderBy("createdAt","desc")

    );

    const snapshot = await getDocs(q);

    snapshot.forEach(docSnap=>{

        const story = docSnap.data();

        story.storyId = docSnap.id;

        stories.push(story);

        renderStory(story);

    });

}


// ===============================
// RENDER STORY CARD
// ===============================

function renderStory(story){

    storiesContainer.innerHTML += `

    <div
        class="storyCard"
        data-id="${story.storyId}">

        ${
            story.mediaType === "image"

            ?

            `<img src="${story.mediaUrl}">`

            :

            `<video
                muted
                playsinline
                preload="metadata"
                src="${story.mediaUrl}">
            </video>`
        }

        <div class="storyUser">

            <img src="${story.userPhoto}">

        </div>

        <div class="storyName">

            ${story.username}

        </div>

    </div>

    `;

}


// ===============================
// OPEN STORY
// ===============================

document.addEventListener("click",async(e)=>{

    const card = e.target.closest(".storyCard");

    if(!card) return;

    currentIndex = stories.findIndex(

        story => story.storyId === card.dataset.id

    );

    if(currentIndex === -1) return;

    await openStory();

});


// ===============================
// OPEN STORY
// ===============================

async function openStory(){

    const story = stories[currentIndex];

    if(!story) return;

    storyViewer.classList.remove("hidden");

    document.getElementById("storyUserPhoto").src =
    story.userPhoto;

    document.getElementById("storyUsername").textContent =
    story.username;

    document.getElementById("storyTime").textContent =
    getTimeAgo(story.createdAt);

    // -----------------------------
    // Media
    // -----------------------------

    if(story.mediaType === "image"){

        storyMediaContainer.innerHTML = `
            <img
                src="${story.mediaUrl}"
                class="storyImage">
        `;

    }else{

        storyMediaContainer.innerHTML = `
            <video
                id="storyVideo"
                autoplay
                playsinline
                controls="false"
                src="${story.mediaUrl}">
            </video>
        `;

    }

    // -----------------------------
    // Increase views only once
    // -----------------------------

    if(
        !story.viewers ||
        !story.viewers.includes(currentUser.uid)
    ){

        await updateDoc(
            doc(db,"stories",story.storyId),
            {
                views:increment(1),
                viewers:arrayUnion(currentUser.uid)
            }
        );

        story.views=(story.views||0)+1;

        if(!story.viewers){

            story.viewers=[];

        }

        story.viewers.push(currentUser.uid);

    }

    // -----------------------------
    // Analytics
    // -----------------------------

    const analytics =
    document.getElementById("storyAnalytics");

    if(analytics){

        if(story.uid===currentUser.uid){

            analytics.classList.remove("hidden");

            const views =
            document.getElementById("storyViews");

            if(views){

                views.textContent=
                story.views||0;

            }

            const reactions =
            document.getElementById("storyReactionCount");

            if(reactions){

                reactions.textContent=
                story.reactions
                ?
                Object.keys(story.reactions).length
                :
                0;

            }

            const timeLeft =
            document.getElementById("storyTimeLeft");

            if(timeLeft){

                timeLeft.textContent=
                getTimeLeft(story.expiresAt);

            }

        }else{

            analytics.classList.add("hidden");

        }

    }

    startProgress();

}


// ===============================
// TIME AGO
// ===============================

function getTimeAgo(timestamp){

    if(!timestamp){

        return "Just now";

    }

    const date=timestamp.toDate();

    const seconds=
    Math.floor(
        (Date.now()-date.getTime())/1000
    );

    if(seconds<60){

        return "Just now";

    }

    const minutes=
    Math.floor(seconds/60);

    if(minutes<60){

        return minutes+"m ago";

    }

    const hours=
    Math.floor(minutes/60);

    if(hours<24){

        return hours+"h ago";

    }

    const days=
    Math.floor(hours/24);

    if(days===1){

        return "Yesterday";

    }

    if(days<7){

        return days+"d ago";

    }

    return date.toLocaleDateString();

}


// ===============================
// PROGRESS BAR
// ===============================

function startProgress(){

    clearInterval(progressTimer);

    clearTimeout(storyTimer);

    storyProgress.innerHTML="<span></span>";

    const fill=
    storyProgress.querySelector("span");

    let percent=0;

    const story=
    stories[currentIndex];

    let duration=5000;

    if(story.mediaType==="video"){

        duration=30000;

    }

    const step=
    duration/100;

    progressTimer=setInterval(()=>{

        percent++;

        fill.style.width=percent+"%";

        if(percent>=100){

            clearInterval(progressTimer);

        }

    },step);

    storyTimer=
    setTimeout(nextStory,duration);

}




// ===============================
// NEXT STORY
// ===============================

function nextStory(){

    clearInterval(progressTimer);

    clearTimeout(storyTimer);

    currentIndex++;

    if(currentIndex>=stories.length){

        storyViewer.classList.add("hidden");

        return;

    }

    openStory();

}


// ===============================
// PREVIOUS STORY
// ===============================

function previousStory(){

    clearInterval(progressTimer);

    clearTimeout(storyTimer);

    if(currentIndex===0){

        return;

    }

    currentIndex--;

    openStory();

}


// ===============================
// CLOSE STORY
// ===============================

document.getElementById("closeStory").onclick=()=>{

    clearInterval(progressTimer);

    clearTimeout(storyTimer);

    storyViewer.classList.add("hidden");

};


// ===============================
// STORY REACTIONS
// ===============================

document.querySelectorAll(".reactionBtn").forEach(btn=>{

    btn.onclick=async()=>{

        const story=stories[currentIndex];

        const reaction=btn.dataset.reaction;

        await updateDoc(

            doc(db,"stories",story.storyId),

            {

                [`reactions.${currentUser.uid}`]:reaction

            }

        );

        if(!story.reactions){

            story.reactions={};

        }

        story.reactions[currentUser.uid]=reaction;

        const total=document.getElementById("storyReactionCount");

        if(total){

            total.textContent=

            Object.keys(story.reactions).length;

        }

    };

});


// ===============================
// REPLY TO STORY
// ===============================

document.getElementById("sendStoryReply").onclick=async()=>{

    const input=document.getElementById("storyReplyInput");

    const text=input.value.trim();

    if(!text) return;

    const story=stories[currentIndex];

    await addDoc(

        collection(db,"messages"),

        {

            from:currentUser.uid,

            fromName:currentUserData.username,

            fromPhoto:currentUserData.photo,

            to:story.uid,

            message:text,

            type:"storyReply",

            storyId:story.storyId,

            createdAt:serverTimestamp(),

            seen:false

        }

    );

    input.value="";

    alert("Reply sent.");

};


// ===============================
// SHOW STORY VIEWERS
// ===============================

document.getElementById("showViewers").onclick=async()=>{

    const story=stories[currentIndex];

    const list=document.getElementById("viewersList");

    list.innerHTML="";

    for(const uid of story.viewers||[]){

        const snap=await getDoc(

            doc(db,"users",uid)

        );

        if(!snap.exists()) continue;

        const user=snap.data();

        list.innerHTML+=`

        <div class="viewerItem">

            <img src="${user.photo}">

            <div>

                <strong>

                    ${user.username}

                </strong>

            </div>

        </div>

        `;

    }

    document

    .getElementById("viewersModal")

    .classList.remove("hidden");

};


document

.getElementById("closeViewers")

.onclick=()=>{

    document

    .getElementById("viewersModal")

    .classList.add("hidden");

};


// ===============================
// ADD STORY TO HIGHLIGHTS
// ===============================

document

.getElementById("addToHighlight")

.onclick=()=>{

    document

    .getElementById("highlightModal")

    .classList.remove("hidden");

};


document

.getElementById("cancelHighlight")

.onclick=()=>{

    document

    .getElementById("highlightModal")

    .classList.add("hidden");

};


document

.getElementById("saveHighlight")

.onclick=async()=>{

    const title=

    document

    .getElementById("highlightTitle")

    .value

    .trim();

    if(!title){

        alert("Enter highlight title.");

        return;

    }

    const story=stories[currentIndex];

    await addDoc(

        collection(db,"highlights"),

        {

            uid:currentUser.uid,

            title,

            coverImage:story.mediaUrl,

            stories:[story.storyId],

            createdAt:serverTimestamp()

        }

    );

    document

    .getElementById("highlightTitle")

    .value="";

    document

    .getElementById("highlightModal")

    .classList.add("hidden");

    alert("Added to Highlights.");

};




// =====================================
// STORY UPLOAD
// =====================================

storyMedia.addEventListener("change", async()=>{

    const file = storyMedia.files[0];

    if(!file) return;

    try{

        const upload = await uploadToCloudinary(file);

        const storyId = crypto.randomUUID();

        const expiresAt = new Date();

        expiresAt.setHours(expiresAt.getHours()+24);

        await setDoc(

            doc(db,"stories",storyId),

            {

                storyId,

                uid:currentUser.uid,

                username:currentUserData.username,

                userPhoto:currentUserData.photo,

                mediaUrl:upload.secure_url,

                mediaType:upload.resource_type,

                cloudinaryPublicId:upload.public_id,

                views:0,

                viewers:[],

                reactions:{},

                createdAt:serverTimestamp(),

                expiresAt

            }

        );

        storyMedia.value="";

        await loadStories();

        alert("Story uploaded successfully.");

    }catch(err){

        console.error(err);

        alert("Upload failed.");

    }

});



// =====================================
// CLOUDINARY
// =====================================

async function uploadToCloudinary(file){

    const fd = new FormData();

    fd.append("file",file);

    fd.append("upload_preset",UPLOAD_PRESET);

    const res = await fetch(

        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,

        {

            method:"POST",

            body:fd

        }

    );

    return await res.json();

}



// =====================================
// REMOVE EXPIRED STORIES
// =====================================

async function removeExpiredStories(){

    const snapshot = await getDocs(

        collection(db,"stories")

    );

    const now = new Date();

    for(const docSnap of snapshot.docs){

        const story = docSnap.data();

        if(

            story.expiresAt &&

            story.expiresAt.toDate() < now

        ){

            await deleteDoc(

                doc(db,"stories",story.storyId)

            );

        }

    }

}



// =====================================
// TIME LEFT
// =====================================

function getTimeLeft(expiresAt){

    if(!expiresAt) return "";

    const now = new Date();

    const end = expiresAt.toDate();

    const diff = end-now;

    if(diff<=0){

        return "Expired";

    }

    const hours = Math.floor(diff/3600000);

    const minutes = Math.floor((diff%3600000)/60000);

    return `${hours}h ${minutes}m left`;

}



// =====================================
// TOUCH EVENTS
// =====================================

storyViewer.addEventListener("touchstart",(e)=>{

    touchStartX = e.changedTouches[0].screenX;

    clearInterval(progressTimer);

    clearTimeout(storyTimer);

    const video = storyMediaContainer.querySelector("video");

    if(video){

        video.pause();

    }

});



storyViewer.addEventListener("touchend",(e)=>{

    touchEndX = e.changedTouches[0].screenX;

    const distance = touchStartX-touchEndX;

    if(distance>60){

        nextStory();

        return;

    }

    if(distance<-60){

        previousStory();

        return;

    }

    const video = storyMediaContainer.querySelector("video");

    if(video){

        video.play();

    }

    startProgress();

});



// =====================================
// KEYBOARD SHORTCUTS
// =====================================

document.addEventListener("keydown",(e)=>{

    if(storyViewer.classList.contains("hidden")) return;

    if(e.key==="ArrowRight"){

        nextStory();

    }

    if(e.key==="ArrowLeft"){

        previousStory();

    }

    if(e.key==="Escape"){

        document

        .getElementById("closeStory")

        .click();

    }

});



// =====================================
// STORY CONTROL BUTTONS
// =====================================

document

.getElementById("nextStory")

.onclick = nextStory;



document

.getElementById("prevStory")

.onclick = previousStory;



document

.getElementById("closeStory")

.onclick = ()=>{

    clearInterval(progressTimer);

    clearTimeout(storyTimer);

    storyViewer.classList.add("hidden");

};



// =====================================
// REFRESH STORIES EVERY 60 SECONDS
// =====================================

setInterval(async()=>{

    await removeExpiredStories();

    await loadStories();

},60000);