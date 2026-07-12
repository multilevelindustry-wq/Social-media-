import { createNotification } from "./notification-helper.js";


import { auth, db } from "./firebase.js";


import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
collection,
query,
where,
orderBy,
onSnapshot,
doc,
updateDoc,
getDoc,
getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const notificationsList=document.getElementById("notificationsList");
const markAllRead=document.getElementById("markAllRead");

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

document.getElementById("userAvatar").src=

currentUserData.photo;

listenNotifications();

});



function listenNotifications(){

const q=query(

collection(db,"notifications"),

where("receiverUid","==",currentUser.uid),

orderBy("createdAt","desc")

);

onSnapshot(q,(snapshot)=>{

notificationsList.innerHTML="";

snapshot.forEach(docSnap=>{

renderNotification(

docSnap.id,

docSnap.data()

);

});

updateNotificationBadge();

});

}


function renderNotification(id,data){

const time=data.createdAt?.toDate()

.toLocaleString()||"";

notificationsList.innerHTML+=`

<div

class="notificationCard

${data.isRead?"read":"unread"}"

data-id="${id}"

data-type="${data.type}"

data-post="${data.postId||""}"

data-group="${data.groupId||""}"

data-chat="${data.chatId||""}"

data-user="${data.senderUid||""}">

<img

class="notificationAvatar"

src="${data.senderPhoto}">

<div class="notificationContent">

<h3>

${data.title}

</h3>

<p>

${data.message}

</p>

<div class="notificationTime">

${time}

</div>

</div>

<span class="notificationType">

${data.type}

</span>

</div>

`;

}



document.addEventListener("click",async(e)=>{

const card=e.target.closest(".notificationCard");

if(!card) return;

await updateDoc(

doc(db,"notifications",card.dataset.id),

{

isRead:true

}

);

switch(card.dataset.type){

case "like":

case "comment":

location.href=

`post.html?id=${card.dataset.post}`;

break;

case "follow":

location.href=

`profile.html?uid=${card.dataset.user}`;

break;

case "message":

location.href=

`messages.html?uid=${card.dataset.user}`;

break;

case "group":

location.href=

`group.html?id=${card.dataset.group}`;

break;

}

});



markAllRead.addEventListener("click",async()=>{

const snapshot=await getDocs(

query(

collection(db,"notifications"),

where("receiverUid","==",currentUser.uid)

)

);

const promises=[];

snapshot.forEach(docSnap=>{

promises.push(

updateDoc(

doc(db,"notifications",docSnap.id),

{

isRead:true

}

)

);

});

await Promise.all(promises);

});



function updateNotificationBadge(){

const unread=document.querySelectorAll(".unread").length;

const badge=document.getElementById("notificationBadge");

if(!badge) return;

badge.textContent=unread;

badge.style.display=

unread>0

?

"flex"

:

"none";

}


