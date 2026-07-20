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

    const post = docSnap.data();

    if(!post.postId){

        post.postId = docSnap.id;

    }

    groupPosts.push(post);

});

// Render posts with ads
renderGroupFeed(groupPosts);

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



window.openPost = function(postId){

    const url = `group-post.html?id=${postId}`;

    if(shouldOpenDirectLink()){

        openDirectLink();

    }

    location.href = url;

};


function renderGroupFeed(posts){

    posts.forEach((post,index)=>{

        renderPost(post);

        if(shouldInsertAd(index + 1)){

            insertFeedAd(groupPostsContainer);

        }

    });

}




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



