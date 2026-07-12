import { auth, db } from "./firebase.js";

import {
signOut,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import { createNotification } from "./notification-helper.js";

import {
doc,
getDoc,
updateDoc,
increment,
arrayUnion,
arrayRemove,
collection,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

let loadedUsers = [];

const params = new URLSearchParams(location.search);
const profileUid = params.get("uid");

const followersCard =
document.getElementById("followersCard");

const followingCard =
document.getElementById("followingCard");

const followModal =
document.getElementById("followModal");

const followTitle =
document.getElementById("followTitle");

const followList =
document.getElementById("followList");

const followSearch =
document.getElementById("followSearch");

const closeFollowModal =
document.getElementById("closeFollowModal");

const myAvatar =
document.getElementById("myAvatar");

const coverPhoto =
document.getElementById("coverPhoto");

const profilePhoto =
document.getElementById("profilePhoto");

const profileName =
document.getElementById("profileName");

const profileBio =
document.getElementById("profileBio");

const creatorPosts =
document.getElementById("creatorPosts");

const creatorReels =
document.getElementById("creatorReels");

const followBtn =
document.getElementById("followBtn");

const messageBtn =
document.getElementById("messageBtn");

let currentUser;
let viewingUserId;

onAuthStateChanged(auth, async(user)=>{

if(!user){

location.href="login.html";
return;

}

currentUser = user;

await loadMyAvatar();
await loadProfile();
await loadPosts();
await loadReels();

});

async function loadMyAvatar(){

const snap = await getDoc(
doc(db,"users",currentUser.uid)
);

if(snap.exists()){

myAvatar.src =
snap.data().photo ||
"assets/default-avatar.png";

}

}


async function loadProfile(){

const snap = await getDoc(
doc(db,"users",profileUid)
);

if(!snap.exists()) return;

const user = snap.data();

viewingUserId = user.uid;

coverPhoto.src =
user.coverPhoto ||
"assets/default-cover.jpg";

profilePhoto.src =
user.photo ||
"assets/default-avatar.png";

profileName.textContent =
user.username || "Unknown";

profileBio.textContent =
user.bio || "No bio yet.";

document.getElementById("verifiedBadge").style.display =
user.verified ? "inline-block" : "none";

/* Online Status */

const indicator =
document.getElementById("onlineIndicator");

const status =
document.getElementById("onlineText");

if(user.online){

indicator.className = "onlineDot";
status.textContent = "Online";

}else{

indicator.className = "offlineDot";
status.textContent = "Offline";

}

/* Last Seen */

if(user.lastSeen){

document.getElementById("lastSeen").textContent =
"Last seen: " +
user.lastSeen.toDate().toLocaleString();

}

/* Joined Date */

if(user.joinedAt){

document.getElementById("joinedDate").textContent =
"Joined: " +
user.joinedAt.toDate().toLocaleDateString();

}

/* Stats */

document.getElementById("totalFollowers").textContent =
user.followersCount || 0;

document.getElementById("totalFollowing").textContent =
user.followingCount || 0;

document.getElementById("totalIncome").textContent =
"$" + (user.totalIncome || 0).toFixed(2);

/* Check Follow */

await checkFollowStatus();

/* My Own Profile */

if(profileUid === currentUser.uid){

followBtn.style.display = "none";

messageBtn.textContent = "Edit Profile";

messageBtn.onclick = ()=>{

location.href = "settings.html";

};

}

}



async function loadPosts(){

creatorPosts.innerHTML = "";

const q = query(

collection(db,"posts"),

where("uid","==",profileUid)

);

const snapshot = await getDocs(q);

document.getElementById("totalPosts").textContent =
snapshot.size;

snapshot.forEach(docSnap=>{

const post = docSnap.data();

creatorPosts.innerHTML += `

<div class="creatorCard"
onclick="location.href='post.html?id=${post.postId}'">

${renderMedia(post)}

<div class="creatorContent">

<h3>${post.title}</h3>

<p>${(post.description || "").substring(0,100)}...</p>

<div class="creatorMeta">

<span>👁 ${post.views || 0}</span>

<span>❤️ ${post.likes || 0}</span>

</div>

</div>

</div>

`;

});

}



async function loadReels(){

creatorReels.innerHTML = "";

const q = query(

collection(db,"reels"),

where("uid","==",profileUid)

);

const snapshot = await getDocs(q);

if(snapshot.empty){

creatorReels.innerHTML = `

<div class="emptyState">

<h3>No reels yet</h3>

<p>This creator hasn't uploaded any reels.</p>

</div>

`;

return;

}

snapshot.forEach(docSnap=>{

const reel = docSnap.data();

creatorReels.innerHTML += `

<div
class="creatorReelCard"
onclick="location.href='reels.html?reel=${docSnap.id}'">

<video muted preload="metadata">

<source src="${reel.videoUrl}">

</video>

<div class="reelOverlay">

❤️ ${reel.likes || 0}

&nbsp;&nbsp;

👁 ${reel.views || 0}

</div>

</div>

`;

});

}



function renderMedia(post){

if(post.mediaType==="image"){

return `

<img
loading="lazy"
src="${post.mediaUrl}">

`;

}

return `

<video preload="metadata">

<source src="${post.mediaUrl}">

</video>

`;

}



async function checkFollowStatus(){

if(currentUser.uid === viewingUserId){

followBtn.style.display = "none";
return;

}

const mySnap = await getDoc(
doc(db,"users",currentUser.uid)
);

if(!mySnap.exists()) return;

const myData = mySnap.data();

const followingList = Array.isArray(myData.following)
? myData.following
: [];

if(followingList.includes(viewingUserId)){

followBtn.textContent = "Following";
followBtn.classList.add("following");

}else{

followBtn.textContent = "Follow";
followBtn.classList.remove("following");

}

}



followBtn.addEventListener("click", async()=>{

const myRef = doc(db,"users",currentUser.uid);

const creatorRef = doc(db,"users",viewingUserId);

const mySnap = await getDoc(myRef);

if(!mySnap.exists()) return;

const myData = mySnap.data();

const followingList = Array.isArray(myData.following)
? myData.following
: [];

const following =
followingList.includes(viewingUserId);

if(following){

await updateDoc(myRef,{

following: arrayRemove(viewingUserId),

followingCount: increment(-1)

});

await updateDoc(creatorRef,{

followers: arrayRemove(currentUser.uid),

followersCount: increment(-1)

});

}else{

await updateDoc(myRef,{

following: arrayUnion(viewingUserId),

followingCount: increment(1)

});

await updateDoc(creatorRef,{

followers: arrayUnion(currentUser.uid),

followersCount: increment(1)

});

const meSnap = await getDoc(
doc(db,"users",currentUser.uid)
);

if(meSnap.exists()){

const me = meSnap.data();

await createNotification({

receiverUid: viewingUserId,

senderUid: currentUser.uid,

senderName: me.username,

senderPhoto: me.photo,

title: "New Follower",

message: `${me.username} started following you.`,

type: "follow"

});

}

}

await loadProfile();

});




messageBtn.addEventListener("click",()=>{

if(profileUid===currentUser.uid){

location.href="settings.html";

}else{

location.href=`messages.html?uid=${profileUid}`;

}

});



document.getElementById("logoutBtn").addEventListener("click",async()=>{

const confirmLogout=confirm("Are you sure you want to log out?");

if(!confirmLogout) return;

try{

await signOut(auth);

location.href="login.html";

}catch(error){

alert(error.message);

}

});



async function loadFollowList(type){

followModal.classList.remove("hidden");

followTitle.textContent=
type==="followers"
? "Followers"
: "Following";

followList.innerHTML="Loading...";

loadedUsers=[];

const snap=await getDoc(doc(db,"users",profileUid));

if(!snap.exists()) return;

const user=snap.data();

let ids=
type==="followers"
? user.followers
: user.following;

if(!Array.isArray(ids)){

ids=[];

}

followList.innerHTML="";

if(ids.length===0){

followList.innerHTML=
"<p style='padding:20px'>No users found.</p>";

return;

}

const users=await Promise.all(

ids.map(uid=>getDoc(doc(db,"users",uid)))

);

users.forEach(docSnap=>{

if(!docSnap.exists()) return;

loadedUsers.push(docSnap.data());

});

renderFollowList(loadedUsers);

}



closeFollowModal.addEventListener("click",()=>{

followModal.classList.add("hidden");

});



followersCard.addEventListener("click",()=>{

loadFollowList("followers");

});



followingCard.addEventListener("click",()=>{

loadFollowList("following");

});



followSearch.addEventListener("input",()=>{

const keyword=
followSearch.value.toLowerCase().trim();

const filtered=
loadedUsers.filter(user=>

(user.username||"")
.toLowerCase()
.includes(keyword)

);

renderFollowList(filtered);

});



function renderFollowList(users){

followList.innerHTML="";

users.forEach(person=>{

const isMe=
person.uid===currentUser.uid;

followList.innerHTML+=`

<div class="followUser">

<div class="followLeft"

onclick="location.href='profile.html?uid=${person.uid}'">

<img src="${person.photo||'assets/default-avatar.png'}">

<div class="followInfo">

<h3>${person.username}</h3>

<p>${person.bio||""}</p>

</div>

</div>

${

isMe

?``

:`<button
class="miniFollowBtn"
data-uid="${person.uid}">

Follow

</button>`

}

</div>

`;

});

attachFollowButtons();

}



async function followUser(btn){

const uid=btn.dataset.uid;

const myRef=doc(db,"users",currentUser.uid);

const otherRef=doc(db,"users",uid);

const mySnap=await getDoc(myRef);

if(!mySnap.exists()) return;

const myData=mySnap.data();

const followingList=
Array.isArray(myData.following)
? myData.following
: [];

const following=
followingList.includes(uid);

if(following){

await updateDoc(myRef,{

following:arrayRemove(uid),

followingCount:increment(-1)

});

await updateDoc(otherRef,{

followers:arrayRemove(currentUser.uid),

followersCount:increment(-1)

});

btn.textContent="Follow";

btn.classList.remove("miniFollowing");

}else{

await updateDoc(myRef,{

following:arrayUnion(uid),

followingCount:increment(1)

});

await updateDoc(otherRef,{

followers:arrayUnion(currentUser.uid),

followersCount:increment(1)

});

btn.textContent="Following";

btn.classList.add("miniFollowing");

}

}



function attachFollowButtons(){

document
.querySelectorAll(".miniFollowBtn")
.forEach(btn=>{

btn.onclick=()=>{

followUser(btn);

};

});

}




const tabButtons =
document.querySelectorAll(".tabBtn");

const tabContents =
document.querySelectorAll(".tabContent");

tabButtons.forEach(btn=>{

btn.addEventListener("click",()=>{

tabButtons.forEach(button=>{

button.classList.remove("active");

});

tabContents.forEach(tab=>{

tab.classList.remove("active");

});

btn.classList.add("active");

const target =
document.getElementById(
btn.dataset.tab + "Tab"
);

if(target){

target.classList.add("active");

}

});

});

