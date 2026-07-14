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
serverTimestamp,
arrayUnion,
arrayRemove
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const CLOUD_NAME="diqrjgobk";
const UPLOAD_PRESET="starcode";


const groupsContainer=document.getElementById("groupsContainer");
const createGroupBtn=document.getElementById("createGroupBtn");
const createGroupModal=document.getElementById("createGroupModal");
const groupForm=document.getElementById("groupForm");

const groupName=document.getElementById("groupName");
const groupDescription=document.getElementById("groupDescription");
const groupPrivacy=document.getElementById("groupPrivacy");
const groupCover=document.getElementById("groupCover");

const searchGroup=document.getElementById("searchGroup");


let currentUser;
let currentUserData;


onAuthStateChanged(auth,async(user)=>{

if(!user){

location.href="login.html";

return;

}

currentUser=user;

const snap=await getDoc(doc(db,"users",user.uid));

currentUserData=snap.data();

document.getElementById("userAvatar").src=currentUserData.photo;

loadGroups();

});



createGroupBtn.onclick=()=>{

createGroupModal.classList.remove("hidden");

};

window.onclick=(e)=>{

if(e.target===createGroupModal){

createGroupModal.classList.add("hidden");

}

};



groupForm.addEventListener("submit",async(e)=>{

e.preventDefault();

let cover="";

if(groupCover.files.length){

const upload=await uploadToCloudinary(groupCover.files[0]);

cover=upload.secure_url;

}

const groupId=crypto.randomUUID();

await setDoc(

doc(db,"groups",groupId),

{

groupId,

name:groupName.value.trim(),

description:groupDescription.value.trim(),

cover,

privacy:groupPrivacy.value,

ownerUid:currentUser.uid,

ownerName:currentUserData.username,

ownerPhoto:currentUserData.photo,

members:[currentUser.uid],

posts:0,

createdAt:serverTimestamp(),

updatedAt:serverTimestamp()

}

);

createGroupModal.classList.add("hidden");

groupForm.reset();

loadGroups();

});



async function uploadToCloudinary(file){

const fd=new FormData();

fd.append("file",file);

fd.append("upload_preset",UPLOAD_PRESET);

const res=await fetch(

`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,

{

method:"POST",

body:fd

}

);

return await res.json();

}



async function loadGroups(){

groupsContainer.innerHTML="";

const snapshot=await getDocs(

collection(db,"groups")

);

snapshot.forEach(docSnap=>{

renderGroup(docSnap.data());

});

}

function renderGroup(group){

const joined=group.members?.includes(currentUser.uid);

groupsContainer.innerHTML+=`

<div
class="groupCard"
onclick="location.href='group.html?id=${group.groupId}'">

<img

class="groupCover"

src="${group.cover||'assets/default-cover.jpg'}">

<div class="groupContent">

<h2>${group.name}</h2>

<p>${group.description}</p>

<div class="groupMeta">

<span>

👥 ${group.members?.length||0} Members

</span>

<span>

${group.privacy}

</span>

</div>

<button

class="joinBtn"

data-id="${group.groupId}">

${joined?"Leave Group":"Join Group"}

</button>

</div>

</div>

`;

}


document.addEventListener("click",async(e)=>{

if(!e.target.classList.contains("joinBtn")) return;

const id=e.target.dataset.id;

const ref=doc(db,"groups",id);

const snap=await getDoc(ref);

const group=snap.data();

if(group.members.includes(currentUser.uid)){

await updateDoc(ref,{

members:arrayRemove(currentUser.uid)

});

}else{

await updateDoc(ref,{

members:arrayUnion(currentUser.uid)

});

}

loadGroups();

});



searchGroup.addEventListener("input",()=>{

const keyword=searchGroup.value.toLowerCase();

document.querySelectorAll(".groupCard").forEach(card=>{

const title=card.querySelector("h2").textContent.toLowerCase();

card.style.display=

title.includes(keyword)

?

"block"

:

"none";

});

});


