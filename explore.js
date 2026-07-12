import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
collection,
query,
orderBy,
getDocs,
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const exploreGrid=document.getElementById("exploreGrid");
const searchInput=document.getElementById("exploreSearch");

let currentUser;
let currentUserData;
let allPosts=[];



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

loadExplore();

});



async function loadExplore(){

exploreGrid.innerHTML="";

allPosts=[];

const q=query(

collection(db,"posts"),

orderBy("views","desc")

);

const snapshot=await getDocs(q);

snapshot.forEach(docSnap=>{

const post=docSnap.data();

allPosts.push(post);

renderPost(post);

});

}


function renderPost(post){

exploreGrid.innerHTML+=`

<div

class="exploreCard"

data-id="${post.postId}"

data-user="${post.uid}">

${post.mediaType==="image"

?

`<img src="${post.mediaUrl}">`

:

`<video muted src="${post.mediaUrl}"></video>`}

<div class="exploreContent">

<div class="exploreUser">

<img src="${post.userPhoto}">

<div>

<h4>${post.username}</h4>

<span>${post.createdAt?.toDate().toLocaleDateString()||""}</span>

</div>

</div>

<h3>${post.title}</h3>

<p>${post.description.substring(0,120)}...</p>

<div class="exploreStats">

<span>👁 ${post.views||0}</span>

<span>❤️ ${post.likes||0}</span>

<span>💬 ${post.comments||0}</span>

</div>

</div>

</div>

`;

}



searchInput.addEventListener("input",()=>{

const keyword=

searchInput.value

.toLowerCase()

.trim();

exploreGrid.innerHTML="";

allPosts

.filter(post=>

post.title.toLowerCase().includes(keyword)

||

post.description.toLowerCase().includes(keyword)

||

post.username.toLowerCase().includes(keyword)

)

.forEach(renderPost);

});




document.addEventListener("click",(e)=>{

const card=e.target.closest(".exploreCard");

if(!card) return;

location.href=

`post.html?id=${card.dataset.id}`;

});


const categoryButtons=

document.querySelectorAll(

".exploreCategories button"

);

categoryButtons.forEach(button=>{

button.addEventListener("click",()=>{

categoryButtons.forEach(btn=>

btn.classList.remove("active")

);

button.classList.add("active");

filterCategory(

button.textContent

);

});

});


function filterCategory(category){

exploreGrid.innerHTML="";

let filtered=[...allPosts];

switch(category){

case "Photos":

filtered=

filtered.filter(post=>

post.mediaType==="image"

);

break;

case "Videos":

filtered=

filtered.filter(post=>

post.mediaType==="video"

);

break;

case "Trending":

filtered.sort(

(a,b)=>

(b.views||0)-(a.views||0)

);

break;

case "Creators":

filtered.sort(

(a,b)=>

(b.followers||0)-(a.followers||0)

);

break;

}

filtered.forEach(renderPost);

}



window.addEventListener("scroll",()=>{

if(

window.innerHeight+

window.scrollY

>=

document.body.offsetHeight-300

){

console.log(

"Load more posts..."

);

}

});


