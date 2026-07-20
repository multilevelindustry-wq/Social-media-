import { auth, db } from "./firebase.js";

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

import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";




/*==================================================
HOME FEED ADS ENGINE
PART 1 - CONFIG
==================================================*/


//==================================================
// SETTINGS
//==================================================

const ADS_CONFIG={

    // Load 10 posts at a time
    postBatch:10,

    // Show first ad after first post
    firstAdAfter:1,

    // Then every 2 posts
    adFrequency:1,

    // Direct Link
    directMin:1,
    directMax:2

};


//==================================================
// ROTATION STATE
//==================================================

const ADS_STATE={

    // Adsterra rotation
    adsterraIndex:0,

    // Manual rotation
    manualIndex:0,

    // Counts how many Adsterra ads
    // have been shown
    adsterraShown:0,

    // 0 = first manual
    // 1 = second manual
    manualPair:0

};


//==================================================
// ADSTERRA TYPES
//==================================================

const ADSTERRA_TYPES=[

"300",

"320",

"native"

];


//==================================================
// MANUAL ADS
//==================================================
const MANUAL_ADS=[

{

advertiser:"LoveNest Essentials",

avatar:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHKkCQmdKXdvSJQAMh2qoknsxEeG8pBTFI8XiJgOIcIw&s=10",

image:"https://www.image2url.com/r2/default/images/1784537355611-3d54056e-5de5-40cb-bfa1-aad2fc5fefff.png",

description:"Exclusive deals available today! Shop our top-rated intimate products and enjoy private, hassle-free delivery.",

button:"Buy Now",

url:"https://bluntutilities.com/t0vst1kf?key=e91199f29dc0671d0d4668b2b5d6acdf"

},

{

advertiser:"Sensual Secrets",

avatar:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2YoZAo8soyiYZ4jwFGcNQYYhLJg2yOk0HkPHu2ufy6A&s=10",

image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCdKPK8gyMKpK_X3thhTU85K5TOyh3Yi21UvKGE6mYZg&s=10",

description:"Surprise your partner with thoughtful intimate gifts that help create memorable moments together.",

button:"Learn More",

url:"https://omg10.com/4/10748984"

},

{

advertiser:"Desire Boutique",

avatar:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfA_pbPG48EEPBCRfowOiTHfsfjSeUih76prBINq01rQ&s=10",

image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHKkCQmdKXdvSJQAMh2qoknsxEeG8pBTFI8XiJgOIcIw&s=10",

description:"Upgrade your personal wellness routine with premium products designed for pleasure, comfort, and satisfaction.",

button:"Learn More",

url:"https://omg10.com/4/10748986"

},

{

advertiser:"Luxe Intimates",

avatar:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_Wjj0aRzTbY1WTvAPUoxK5HhK1juWaswErpC-v-pMiw&s",

image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_Wjj0aRzTbY1WTvAPUoxK5HhK1juWaswErpC-v-pMiw&s",

description:"Find everything you need for a more exciting and fulfilling relationship—all in one trusted store.",

button:"Learn More",

url:"https://bluntutilities.com/t0vst1kf?key=e91199f29dc0671d0d4668b2b5d6acdf"

},

{

advertiser:"Velvet Touch Store",

avatar:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCdKPK8gyMKpK_X3thhTU85K5TOyh3Yi21UvKGE6mYZg&s=10",

image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCdKPK8gyMKpK_X3thhTU85K5TOyh3Yi21UvKGE6mYZg&s=10",

description:"Elevate your romantic moments with carefully selected intimate essentials for comfort, confidence, and connection.",

button:"Learn More",

url:"https://omg10.com/4/7901758"

},

{

advertiser:"Velvet Desire",

avatar:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShJhbgAI9LEU6mRk3NFjwlSzNWne_06jw_MGjIGaXtww&s=10",

image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShJhbgAI9LEU6mRk3NFjwlSzNWne_06jw_MGjIGaXtww&s=10",

description:"Discover bestselling adult wellness products trusted by thousands. Private shopping and secure checkout guaranteed.",

button:"Learn More",

url:"https://omg10.com/4/7897686"

},

{

advertiser:"Intimate Bliss",

avatar:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjBYpGjfBYWO5oHpcz2LNeFQtsyOnWhjZFSLGB3oJl_w&s=10",

image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjBYpGjfBYWO5oHpcz2LNeFQtsyOnWhjZFSLGB3oJl_w&s=10",

description:"Looking to spice up date night? Explore our exclusive collection of quality intimate accessories at amazing prices.",

button:"Learn More",

url:"https://bluntutilities.com/t0vst1kf?key=e91199f29dc0671d0d4668b2b5d6acdf"

},

{

advertiser:"Passion Palace",

avatar:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIiv7d57coKMY7N2Pvvn9cJPZDObTCHzDhyt2URzGFaw&s=10",

image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIiv7d57coKMY7N2Pvvn9cJPZDObTCHzDhyt2URzGFaw&s=10",

description:"Your privacy comes first. Shop premium intimacy products with discreet packaging and reliable nationwide delivery.",

button:"Learn More",

url:"https://omg10.com/4/10748986"

},

{

advertiser:"Midnight Pleasures",

avatar:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHKkCQmdKXdvSJQAMh2qoknsxEeG8pBTFI8XiJgOIcIw&s=10",

image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHKkCQmdKXdvSJQAMh2qoknsxEeG8pBTFI8XiJgOIcIw&s=10",

description:"Experience comfort, quality, and confidence with our carefully curated range of adult wellness essentials.",

button:"Learn More",

url:"https://omg10.com/4/10748984"

},

{

advertiser:"Secret Seduction",

avatar:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_Wjj0aRzTbY1WTvAPUoxK5HhK1juWaswErpC-v-pMiw&s",

image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_Wjj0aRzTbY1WTvAPUoxK5HhK1juWaswErpC-v-pMiw&s",

description:"Rediscover intimacy with premium products designed to bring couples closer. Shop discreetly with fast delivery.",

button:"Learn More",

url:"https://omg10.com/4/7897686"

}

];


//==================================================
// DIRECT LINKS
//==================================================

const DIRECT_LINKS=[

"https://omg10.com/4/10748986",

"https://bluntutilities.com/t0vst1kf?key=e91199f29dc0671d0d4668b2b5d6acdf",

"https://omg10.com/4/7897686",

"https://omg10.com/4/10748984",

"https://omg10.com/4/7901758",

"https://bluntutilities.com/t0vst1kf?key=e91199f29dc0671d0d4668b2b5d6acdf",

"https://omg10.com/4/7901758",

"https://omg10.com/4/10748986",

"https://omg10.com/4/10748984",

"https://bluntutilities.com/t0vst1kf?key=e91199f29dc0671d0d4668b2b5d6acdf"

];


//==================================================
// HELPERS
//==================================================

function random(min,max){

    return Math.floor(

        Math.random()*

        (max-min+1)

    )+min;

}


//==================================================
// SHOULD INSERT AD
//==================================================

function shouldInsertAd(postNumber){

    if(postNumber===ADS_CONFIG.firstAdAfter){

        return true;

    }

    if(

        postNumber>

        ADS_CONFIG.firstAdAfter

    ){

        return (

            (postNumber-

            ADS_CONFIG.firstAdAfter)

            %

            ADS_CONFIG.adFrequency

        )===0;

    }

    return false;

}



/*==================================================
HOME FEED ADS ENGINE
PART 2 - ADSTERRA
==================================================*/


//==================================================
// NEXT ADSTERRA TYPE
//==================================================

function getNextAdsterraType(){

    const type=

    ADSTERRA_TYPES[

        ADS_STATE.adsterraIndex

    ];

    ADS_STATE.adsterraIndex++;

    if(

        ADS_STATE.adsterraIndex>=

        ADSTERRA_TYPES.length

    ){

        ADS_STATE.adsterraIndex=0;

    }

    ADS_STATE.adsterraShown++;

    return type;

}



//==================================================
// SHOW ADSTERRA
//==================================================

function showAdsterra(container){

    if(!container) return;

    container.innerHTML="";

    const type=

    getNextAdsterraType();

    //--------------------------------------------------
    // 300x250
    //--------------------------------------------------

    if(type==="300"){

        const option=document.createElement("script");

        option.text=`

        atOptions={

        key:'0be1e382fd37fb22ea434d15f4bb3687',

        format:'iframe',

        height:250,

        width:300,

        params:{}

        };

        `;

        const invoke=document.createElement("script");

        invoke.src=

        "https://www.highperformanceformat.com/0be1e382fd37fb22ea434d15f4bb3687/invoke.js";

        invoke.async=true;

        container.appendChild(option);

        container.appendChild(invoke);

        return;

    }

    //--------------------------------------------------
    // 320x50
    //--------------------------------------------------

    if(type==="320"){

        const option=document.createElement("script");

        option.text=`

        atOptions={

        key:'c9418dd83a86f8a95d152ae74675f102',

        format:'iframe',

        height:50,

        width:320,

        params:{}

        };

        `;

        const invoke=document.createElement("script");

        invoke.src=

        "https://www.highperformanceformat.com/c9418dd83a86f8a95d152ae74675f102/invoke.js";

        invoke.async=true;

        container.appendChild(option);

        container.appendChild(invoke);

        return;

    }

    //--------------------------------------------------
    // NATIVE
    //--------------------------------------------------

    const script=document.createElement("script");

    script.async=true;

    script.dataset.cfasync="false";

    script.src=

    "https://pl29811018.effectivecpmnetwork.com/1d99478d06f0c78b684ba8b345f25fc5/invoke.js";

    const div=document.createElement("div");

    div.id=

    "container-1d99478d06f0c78b684ba8b345f25fc5_"+

    Date.now();

    container.appendChild(script);

    container.appendChild(div);

}



/*==================================================
HOME FEED ADS ENGINE
PART 3 - MANUAL ADS
==================================================*/


//==================================================
// NEXT MANUAL
//==================================================

function getNextManualAd(){

    const ad=

    MANUAL_ADS[

        ADS_STATE.manualIndex

    ];

    ADS_STATE.manualIndex++;

    if(

        ADS_STATE.manualIndex>=

        MANUAL_ADS.length

    ){

        ADS_STATE.manualIndex=0;

    }

    return ad;

}



//==================================================
// SHOW MANUAL
//==================================================

function showManualAd(container){

    if(!container) return;

    const ad=

    getNextManualAd();
    
    
    container.innerHTML = `

<div class="manualAdCard">

    <div class="manualHeader">

        <img
        src="${ad.avatar}"
        class="manualAvatar">

        <div class="manualInfo">

            <div class="manualName">

                ${ad.advertiser}

            </div>

            <div class="manualSponsored">

                📢 Sponsored

            </div>

        </div>

    </div>

    <a href="${ad.url}" target="_blank">

        <img
        src="${ad.image}"
        class="manualImage">

    </a>

    <div class="manualDescription">

        ${ad.description}

    </div>

    <a
    href="${ad.url}"
    target="_blank"
    class="manualLearnBtn">

        Learn More

    </a>

</div>

`;

}



//==================================================
// NEXT FEED AD
//==================================================

function showNextFeedAd(container){

    //------------------------------------------
    // 3 Adsterra
    //------------------------------------------

    if(

        ADS_STATE.adsterraShown<3

    ){

        showAdsterra(container);

        return;

    }

    //------------------------------------------
    // Manual 1
    //------------------------------------------

    if(

        ADS_STATE.manualPair===0

    ){

        showManualAd(container);

        ADS_STATE.manualPair++;

        return;

    }

    //------------------------------------------
    // Manual 2
    //------------------------------------------

    if(

        ADS_STATE.manualPair===1

    ){

        showManualAd(container);

        ADS_STATE.manualPair=0;

        ADS_STATE.adsterraShown=0;

        return;

    }

}



/*==================================================
HOME FEED ADS ENGINE
PART 4 - FEED INSERTION
==================================================*/


//==================================================
// CREATE AD CONTAINER
//==================================================

function createAdContainer(){

    const box=document.createElement("div");

    box.className="homeFeedAd";

    return box;

}



//==================================================
// INSERT AD
//==================================================

function insertFeedAd(parent){

    if(!parent) return;

    const box=createAdContainer();

    parent.appendChild(box);

    showNextFeedAd(box);

}



//==================================================
// RENDER POSTS WITH ADS
//==================================================

function renderFeed(posts){

    posts.forEach((post,index)=>{

        //------------------------------------------
        // Render normal post
        //------------------------------------------

        createPostCard(post);

        //------------------------------------------
        // First post then every 2 posts
        //------------------------------------------

        const postNumber=index+1;

        if(

            shouldInsertAd(postNumber)

        ){

            insertFeedAd(postsContainer);

        }

    });

}



/*==================================================
HOME FEED ADS ENGINE
PART 5 - INFINITE FEED
==================================================*/


//==================================================
// FEED STATE
//==================================================

let ALL_POSTS=[];

let CURRENT_INDEX=0;

let LOADING_MORE=false;


//==================================================
// LOAD NEXT 10 POSTS
//==================================================

function loadNextPosts(){

    if(LOADING_MORE) return;

    LOADING_MORE=true;

    const batch=

    ALL_POSTS.slice(

        CURRENT_INDEX,

        CURRENT_INDEX+

        ADS_CONFIG.postBatch

    );

    if(batch.length===0){

        LOADING_MORE=false;

        return;

    }

    renderFeed(batch);

    CURRENT_INDEX+=batch.length;

    LOADING_MORE=false;

}



//==================================================
// WATCH SCROLL
//==================================================

function watchFeed(){

    window.addEventListener(

        "scroll",

        ()=>{

            const nearBottom=

            window.innerHeight+

            window.scrollY>=

            document.body.offsetHeight-800;

            if(nearBottom){

                loadNextPosts();

            }

        }

    );

}




/* ==========================================
   GLOBAL VARIABLES
========================================== */

const postsContainer = document.getElementById("postsContainer");
const searchInput = document.getElementById("searchInput");

let currentUser = null;


/* ==========================================
   AUTH
========================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "login.html";
        return;

    }

    currentUser = user;

    await loadPosts();

    listenNotificationBadge();

});


/* ==========================================
   LOAD POSTS
========================================== */

async function loadPosts() {

    postsContainer.innerHTML = `
        <div class="loadingFeed">
            Loading posts...
        </div>
    `;

    try {

        const q = query(

            collection(db, "posts"),

            orderBy("createdAt", "desc"),

            limit(20)

        );

        const snapshot = await getDocs(q);

        postsContainer.innerHTML = "";

        if (snapshot.empty) {

            postsContainer.innerHTML = `

                <div class="emptyFeed">

                    <h3>No posts available.</h3>

                    <p>Be the first to create a post.</p>

                </div>

            `;

            return;

        }

        const posts=[];

snapshot.forEach(docSnap=>{

    const post=docSnap.data();

    if(!post.postId){

        post.postId=docSnap.id;

    }

    posts.push(post);

});

ALL_POSTS = posts;

CURRENT_INDEX = 0;

loadNextPosts();

watchFeed();


    } catch (err) {

        console.error("Failed loading posts:", err);

        postsContainer.innerHTML = `

            <div class="emptyFeed">

                Failed to load posts.

            </div>

        `;

    }

}




/* ==========================================
   CREATE POST CARD
========================================== */

async function createPostCard(post) {

    const card = document.createElement("div");
    card.className = "postCard";

    card.innerHTML = `

    <div class="postHeader">

        <div class="postUser">

            <img
                class="postAvatar"
                src="${post.userPhoto || "assets/default-avatar.png"}"
                alt="Profile">

            <div class="postUserInfo">

                <h3>

                    <a href="profile.html?uid=${post.uid}">

                        ${post.username || "Unknown User"}

                    </a>

                </h3>

                <p>${timeAgo(post.createdAt)}</p>

            </div>

        </div>

        <button
            class="followBtn"
            data-user="${post.uid}">

            Follow

        </button>

    </div>

    <div class="postBody">

        ${post.title ? `
            <h2 class="postTitle">
                ${post.title}
            </h2>
        ` : ""}

        ${post.description ? `
        <p
    class="postPreview"
    onclick="openPost('post.html?id=${post.postId}')">

    ${post.description}

</p>
        ` : ""}

        ${renderMedia(post)}

    </div>

    ${renderFooter(post)}

    `;

    postsContainer.appendChild(card);

    /* ---------- Restore Like ---------- */

    const likeBtn = card.querySelector(".likeBtn");

    if (await checkIfLiked(post.postId)) {

        likeBtn.innerHTML = "❤️ Liked";
        likeBtn.classList.add("liked");

    }

    /* ---------- Restore Save ---------- */

    const saveBtn = card.querySelector(".saveBtn");

    if (await checkIfSaved(post.postId)) {

        saveBtn.innerHTML = "📌 Saved";
        saveBtn.classList.add("saved");

    }

    /* ---------- Restore Follow ---------- */

    const followBtn = card.querySelector(".followBtn");

    if (currentUser.uid === post.uid) {

        followBtn.style.display = "none";

    } else {

        if (await checkIfFollowing(post.uid)) {

            followBtn.innerHTML = "Following";
            followBtn.classList.add("following");

        }

    }

}


/* ==========================================
   RENDER MEDIA
========================================== */

function renderMedia(post) {

    if (!post.mediaUrl) return "";

    if (post.mediaType === "image") {

        return `

        <div class="postMedia">

            <img
                src="${post.mediaUrl}"
                class="postImage"
                onclick="openPost('post.html?id=${post.postId}')">

        </div>

        `;

    }

    return `

    <div class="postMedia">

        <video
            controls
            preload="metadata"
            onclick="openPost('post.html?id=${post.postId}')">

            <source src="${post.mediaUrl}">

        </video>

    </div>

    `;

}


window.openPost = function(url){

    if(typeof shouldOpenDirectLink === "function" &&
       shouldOpenDirectLink()){

        openDirectLink();

    }

    location.href = url;

};
    




/* ==========================================
   RENDER POST FOOTER
========================================== */

function renderFooter(post) {

    return `

    <div class="postStats">

        <span class="viewsCount">
            👁 ${post.views || 0}
        </span>

        <span class="likesCount">
            ❤️ ${post.likes || 0}
        </span>

        <span class="commentsCount">
           💬  ${post.comments || 0}
        </span>

        <span class="sharesCount">
            🔁 ${post.shares || 0}
        </span>

    </div>

    <div class="postActions">

        <button
            class="likeBtn"
            data-id="${post.postId}">

            ❤️ Like

        </button>

        <button
            class="commentBtn"
            data-id="${post.postId}">

            💬 Comment

        </button>

        <button
            class="shareBtn"
            data-id="${post.postId}">

            🔁 Share

        </button>

        <button
            class="saveBtn"
            data-id="${post.postId}">

            🔖 Save

        </button>

        <button
            class="viewBtn"
            data-id="${post.postId}">

            👁 Open

        </button>

    </div>

    `;

}


/* ==========================================
   BUTTON EVENTS
========================================== */

document.addEventListener("click", async (e) => {

    /* ======================
       LIKE
    ====================== */

    if (e.target.classList.contains("likeBtn")) {

        const button = e.target;
        const postId = button.dataset.id;

        await toggleLike(postId);

        const liked = await checkIfLiked(postId);

        if (liked) {

            button.innerHTML = "❤️ Liked";
            button.classList.add("liked");

        } else {

            button.innerHTML = "❤️ Like";
            button.classList.remove("liked");

        }

        return;

    }


    /* ======================
       FOLLOW
    ====================== */

    if (e.target.classList.contains("followBtn")) {

        const button = e.target;
        const creatorUid = button.dataset.user;

        await toggleFollow(creatorUid);

        const following = await checkIfFollowing(creatorUid);

        if (following) {

            button.innerHTML = "Following";
            button.classList.add("following");

        } else {

            button.innerHTML = "Follow";
            button.classList.remove("following");

        }

        return;

    }


    /* ======================
       SAVE
    ====================== */

    if (e.target.classList.contains("saveBtn")) {

        const button = e.target;
        const postId = button.dataset.id;

        await toggleSave(postId);

        const saved = await checkIfSaved(postId);

        if (saved) {

            button.innerHTML = "📌 Saved";
            button.classList.add("saved");

        } else {

            button.innerHTML = "🔖 Save";
            button.classList.remove("saved");

        }

        return;

    }

});



/* ==========================================
   SHARE / COMMENT / VIEW
========================================== */

document.addEventListener("click", async (e) => {

    /* ======================
       SHARE
    ====================== */

    if (e.target.classList.contains("shareBtn")) {

        const postId = e.target.dataset.id;

        try {

            await sharePost(postId);

        } catch (err) {

            console.error("Share Error:", err);

        }

        return;

    }


    /* ======================
       COMMENT
    ====================== */

    if (e.target.classList.contains("commentBtn")) {

        const postId = e.target.dataset.id;

        location.href = `post.html?id=${postId}#comments`;

        return;

    }


    /* ======================
       OPEN POST + RECORD VIEW
    ====================== */

    if (e.target.classList.contains("viewBtn")) {

        const postId = e.target.dataset.id;

        try {

            await recordView(postId);

        } catch (err) {

            console.error("View Error:", err);

        }

        location.href = `post.html?id=${postId}`;

        return;

    }

});


/* ==========================================
   NOTIFICATION BADGE
========================================== */

function listenNotificationBadge() {

    const badge = document.getElementById("notificationBadge");

    if (!badge || !currentUser) return;

    const q = query(

        collection(db, "notifications"),

        where("receiverUid", "==", currentUser.uid)

    );

    onSnapshot(q, (snapshot) => {

        let unread = 0;

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            if (!data.isRead) {

                unread++;

            }

        });

        if (unread > 0) {

            badge.style.display = "flex";
            badge.textContent = unread;

        } else {

            badge.style.display = "none";
            badge.textContent = "0";

        }

    });

}






/* ==========================================
   SEARCH POSTS
========================================== */

if (searchInput) {

    searchInput.addEventListener("input", () => {

        const keyword = searchInput.value
            .trim()
            .toLowerCase();

        document.querySelectorAll(".postCard").forEach((card) => {

            const text = card.textContent.toLowerCase();

            card.style.display = text.includes(keyword)
                ? ""
                : "none";

        });

    });

}


/* ==========================================
   MOBILE NAVIGATION
========================================== */

const mobileRoutes = {

    "host-liveBtn": "host-live.html",

    "groupsBtn": "groups.html",

    "reelsBtn": "reels.html",

    "dashboardBtn": "dashboard.html",

    "settingsBtn": "settings.html"

};

Object.entries(mobileRoutes).forEach(([id, page]) => {

    const btn = document.getElementById(id);

    if (btn) {

        btn.addEventListener("click", () => {

            location.href = page;

        });

    }

});


/* ==========================================
   TIME AGO
========================================== */

function timeAgo(timestamp) {

    if (!timestamp) return "Just now";

    const date = timestamp.toDate();

    const seconds = Math.floor(
        (Date.now() - date.getTime()) / 1000
    );

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {

        return `${minutes}m ago`;

    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {

        return `${hours}h ago`;

    }

    const days = Math.floor(hours / 24);

    if (days < 30) {

        return `${days}d ago`;

    }

    const months = Math.floor(days / 30);

    if (months < 12) {

        return `${months}mo ago`;

    }

    const years = Math.floor(months / 12);

    return `${years}y ago`;

}


/* ==========================================
   HOME READY
========================================== */

console.log("✅ Home page loaded successfully.");





document.getElementById("createPostBox").addEventListener("click", () => {
    location.href = "upload.html";
});
