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
addDoc,
query,
where,
orderBy,
onSnapshot,
serverTimestamp,
updateDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const CLOUD_NAME="diqrjgobk";
const UPLOAD_PRESET="starcode";

const params=new URLSearchParams(location.search);

const otherUid=params.get("uid");

let currentUser;
let currentUserData;
let currentChatId=null;



const conversationList=document.getElementById("conversationList");

const messagesContainer=document.getElementById("messagesContainer");

const messageForm=document.getElementById("messageForm");

const messageInput=document.getElementById("messageInput");

const messageMedia=document.getElementById("messageMedia");

const chatAvatar=document.getElementById("chatAvatar");

const chatName=document.getElementById("chatName");

const chatStatus=document.getElementById("chatStatus");

onAuthStateChanged(auth, async (user)=>{

    if(!user){
        location.href="login.html";
        return;
    }

    currentUser=user;

    const snap=await getDoc(doc(db,"users",user.uid));
    currentUserData=snap.data();

    document.getElementById("myAvatar").src=currentUserData.photo;

    // User is online
    await updateDoc(doc(db,"users",currentUser.uid),{
        online:true
    });

    window.addEventListener("beforeunload",async()=>{
        await updateDoc(doc(db,"users",currentUser.uid),{
            online:false
        });
    });

    await loadConversations();

    if(otherUid){
        await openChat(otherUid);
    }

});



async function loadConversations(){

conversationList.innerHTML="";

const chats=await getDocs(

query(

collection(db,"chats"),

where("users","array-contains",currentUser.uid)

)

);

for(const chat of chats.docs){

await renderConversation(chat.data());

}

}




async function renderConversation(chat){

const otherUid = chat.users.find(uid => uid !== currentUser.uid);

const userSnap = await getDoc(doc(db,"users",otherUid));

if(!userSnap.exists()) return;

const otherUser = userSnap.data();

conversationList.innerHTML += `

<div class="conversationCard" data-user="${otherUid}">

<img src="${otherUser.photo || 'assets/default-avatar.png'}">

<div class="conversationInfo">

<h3>${otherUser.username}</h3>

<p>${chat.lastMessage}</p>

</div>

</div>

`;

}





document.addEventListener("click",async(e)=>{

const card=e.target.closest(".conversationCard");

if(!card) return;

await openChat(card.dataset.user);

});







async function openChat(uid){

    const ids=[currentUser.uid,uid].sort();

    currentChatId=ids.join("_");

    const userSnap=await getDoc(doc(db,"users",uid));

    if(!userSnap.exists()) return;

    const user=userSnap.data();

    chatAvatar.src=user.photo || "assets/default-avatar.png";

    chatName.textContent=user.username;

    chatStatus.textContent=user.online ? "Online" : "Offline";

    listenMessages();

    // Mark received messages as seen
    const snapshot=await getDocs(
        collection(db,"chats",currentChatId,"messages")
    );

    for(const message of snapshot.docs){

        const data=message.data();

        if(
            data.sender!==currentUser.uid &&
            !data.seen
        ){

            await updateDoc(message.ref,{
                seen:true
            });

        }

    }

    // Typing indicator
    messageInput.oninput=async()=>{

        await updateDoc(
            doc(db,"chats",currentChatId),
            {
                typing:currentUser.uid
            }
        );

    };

    messageInput.onblur=async()=>{

        await updateDoc(
            doc(db,"chats",currentChatId),
            {
                typing:""
            }
        );

    };

    onSnapshot(
        doc(db,"chats",currentChatId),
        snap=>{

            if(!snap.exists()) return;

            const chat=snap.data();

            if(
                chat.typing &&
                chat.typing!==currentUser.uid
            ){

                chatStatus.textContent="Typing...";

            }else{

                chatStatus.textContent=user.online
                ? "Online"
                : "Offline";

            }

        }
    );

}





function listenMessages(){

const q=query(

collection(db,"chats",currentChatId,"messages"),

orderBy("createdAt")

);

onSnapshot(q,snapshot=>{

messagesContainer.innerHTML="";

snapshot.forEach(doc=>{

renderMessage(doc.data());

});

messagesContainer.scrollTop=

messagesContainer.scrollHeight;

});

}




function renderMessage(msg){

messagesContainer.innerHTML+=`

<div class="message

${msg.sender===currentUser.uid

?

"sent"

:

"received"}">

<div>

${msg.text||""}

</div>

${renderMedia(msg)}

<div class="messageTime">

${msg.createdAt?.toDate().toLocaleTimeString()||""}

</div>

</div>

`;

}





function renderMedia(msg){

if(!msg.mediaUrl){

return "";

}

if(msg.mediaType==="image"){

return`

<img src="${msg.mediaUrl}">

`;

}

return`

<video controls>

<source src="${msg.mediaUrl}">

</video>

`;

}



messageForm.addEventListener("submit",async(e)=>{

    e.preventDefault();

    if(!currentChatId) return;

    let mediaUrl="";
    let mediaType="";

    if(messageMedia.files.length){

        const upload=await uploadToCloudinary(
            messageMedia.files[0]
        );

        mediaUrl=upload.secure_url;
        mediaType=upload.resource_type;

    }

    const text=messageInput.value.trim();

    await addDoc(
        collection(
            db,
            "chats",
            currentChatId,
            "messages"
        ),
        {
            sender:currentUser.uid,
            text,
            mediaUrl,
            mediaType,
            seen:false,
            createdAt:serverTimestamp()
        }
    );

    await setDoc(
        doc(db,"chats",currentChatId),
        {
            chatId:currentChatId,
            users:currentChatId.split("_"),
            lastMessage:text || "Media",
            updatedAt:serverTimestamp(),
            typing:""
        },
        {
            merge:true
        }
    );

    messageForm.reset();

});




async function uploadToCloudinary(file){

const fd=new FormData();

fd.append("file",file);

fd.append("upload_preset",UPLOAD_PRESET);

const res=await fetch(

`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,

{

method:"POST",

body:fd

}

);

return await res.json();

}









