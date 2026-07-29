const firebaseConfig = {
  apiKey: "AIzaSyAC3qCkDfdS2X8YA6deg01lXif7qAStfQQ",
  authDomain: "neostore-81b57.firebaseapp.com",
  databaseURL: "https://neostore-81b57-default-rtdb.firebaseio.com",
  projectId: "neostore-81b57",
  storageBucket: "neostore-81b57.firebasestorage.app",
  messagingSenderId: "760637387702",
  appId: "1:760637387702:web:3c7c231c34a3513d1a4717",
  measurementId: "G-1PBBK48DCK"
};


firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();



/* =========================
HAMBURGER
========================= */

const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("navMenu");

if(hamburger){

hamburger.onclick = () => {

navMenu.classList.toggle("active");

};

}



/* =========================
SEARCH
========================= */


function searchPosts(){


const value =
document
.getElementById("searchInput")
.value
.toLowerCase();



const filtered =
posts.filter(p=>

p.title
.toLowerCase()
.includes(value)

);



displayPosts(filtered);


}



/* =========================
DISPLAY POSTS HOME PAGE
========================= */


const postsContainer = document.getElementById("postsContainer");




function displayPosts(list){


if(!postsContainer) return;



postsContainer.innerHTML = "";



list.forEach((post,index)=>{


const card = document.createElement("div");


card.className = "post-card";



card.innerHTML = `


<img 
src="${post.image}"
loading="lazy"
alt="${post.title}">



<div class="post-content">


<h3>${post.title}</h3>



<div class="post-views" id="views-${post.slug}">

👁 Loading views...

</div>



<p>${post.excerpt}</p>



<div class="post-actions">


<a 
href="${post.url}"
class="read-btn">

Read More

</a>



<div class="share-buttons">


<a
href="https://wa.me/?text=${encodeURIComponent(post.title+" "+window.location.origin+"/"+post.url)}"
target="_blank"
class="share whatsapp">

WhatsApp

</a>




<a
href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin+"/"+post.url)}"
target="_blank"
class="share facebook">

Facebook

</a>

<a
class="share telegram"
target="_blank"
href="https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}">

Telegram

</a>




<a
href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.origin+"/"+post.url)}"
target="_blank"
class="share x">

X

</a>



<button
class="share copy-link"
onclick="copyPostLink('${post.url}')">

Copy Link

</button>



</div>



</div>


</div>


`;



postsContainer.appendChild(card);



});


}




// START HOME PAGE

if(postsContainer){


displayPosts(
getRandomPosts(posts,16)
);



loadHomepageViews();


}





/* =========================
GET CURRENT POST
========================= */


const postContent =
document.getElementById("postContent");


if(postContent){


const currentPage =
window.location.pathname
.split("/")
.pop();



const post =
posts.find(
p=>p.url===currentPage
);



if(post){



document.title =
post.title;



incrementViews(post.slug);



postContent.innerHTML = `


<img src="${post.image}"
alt="${post.title}"
loading="lazy">


<h1>${post.title}</h1>


<div class="story-share">


<h3>Share This Story</h3>



<a class="share whatsapp"
target="_blank"

href="https://wa.me/?text=${encodeURIComponent(
post.title+" "+window.location.href
)}">

WhatsApp

</a>



<a class="share facebook"
target="_blank"

href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
window.location.href
)}">

Facebook

</a>


<a
class="share telegram"
target="_blank"
href="https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}">

Telegram

</a>



<a class="share x"
target="_blank"

href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}">

X

</a>



<button class="share copy-link"
onclick="copyLink()">

Copy Link

</button>


</div>


${post.content}



`;

setTimeout(()=>{

insertParagraphAds();

},500);



loadRelated(post.slug);


loadComments();


loadPostViews(post.slug);

loadChapterNavigation(post);



}



}




/* =========================
VIEWS
========================= */


async function incrementViews(slug){


const ref =
db.collection("views")
.doc(slug);



const doc =
await ref.get();



if(doc.exists){


await ref.update({

count:
firebase.firestore.FieldValue.increment(1)

});


}else{


await ref.set({

count:1

});


}


}





async function loadHomepageViews(){


posts.forEach(async post=>{


const doc =
await db.collection("views")
.doc(post.slug)
.get();



const el =
document.getElementById(
`views-${post.slug}`
);



if(el){


el.innerHTML =
"👁 "+
(doc.exists ? doc.data().count : 0)
+
" views";


}


});


}





async function loadPostViews(slug){



const doc =
await db.collection("views")
.doc(slug)
.get();



const views =
doc.exists ? doc.data().count : 0;



const h1 =
document.querySelector(".main-post h1");



if(h1){


h1.innerHTML += `

<div class="view-count">

👁 ${views} views

</div>

`;

}



}






/* =========================
RELATED POSTS
========================= */


function loadRelated(currentSlug){



const related =
document.getElementById("relatedPosts");


if(!related)return;



related.innerHTML="";



const random =
posts
.filter(p=>p.slug!==currentSlug)
.sort(()=>0.5-Math.random())
.slice(0,5);



random.forEach((p,i)=>{


const colors =
[
"#0d9488",
"#2563eb",
"#f97316",
"#a855f7",
"#ef4444"
];


related.innerHTML += `


<a href="${p.url}"
class="related-card"
style="border-left:5px solid ${colors[i]}">


<div class="related-title">

${p.title}

</div>


<div class="related-tag">

Read Now →

</div>


</a>


`;

});


}





/* =========================
RANDOM POSTS
========================= */


function getRandomPosts(array,count){


return [...array]
.sort(()=>Math.random()-0.5)
.slice(0,count);


}






/* =========================
COMMENTS
========================= */


async function loadComments(){



const box =
document.getElementById("commentsContainer");


if(!box)return;



const page =
window.location.pathname
.split("/")
.pop();



const snapshot =
await db.collection("comments")
.where("postSlug","==",page)
.get();



box.innerHTML="";



snapshot.forEach(doc=>{


const c=doc.data();


box.innerHTML += `


<div class="comment-card">

<b>${c.name}</b>

<p>${c.text}</p>


</div>


`;


});


}





async function addComment(){



const name =
document.getElementById("commentName").value;


const text =
document.getElementById("commentText").value;



const page =
window.location.pathname
.split("/")
.pop();



if(!name || !text){

alert("Fill all fields");

return;

}



await db.collection("comments")
.add({

postSlug:page,

name,

text,

date:new Date()

});



document.getElementById("commentName").value="";

document.getElementById("commentText").value="";



loadComments();



}







/* =========================
COPY LINKS
========================= */


function copyLink(){


navigator.clipboard.writeText(
window.location.href
);


alert("Link copied!");

}



function copyPostLink(url){


navigator.clipboard.writeText(
window.location.origin+"/"+url
);


alert("Link copied!");

}





function loadChapterNavigation(currentPost) {

  const nav = document.getElementById("chapterNavigation");

  if (!nav) return;


  // Get only chapters from the same story series
  const chapters = posts
    .filter(p => p.series === currentPost.series)
    .sort((a, b) => a.chapter - b.chapter);



  const currentIndex = chapters.findIndex(
    p => p.slug === currentPost.slug
  );



  let html = '<div class="chapter-nav">';



  // Previous button

  if (currentIndex > 0) {

    html += `

    <a class="chapter-btn"
    href="${chapters[currentIndex - 1].url}">

    ← Previous

    </a>

    `;

  }




  // Chapter numbers

  chapters.forEach(ch => {



    if (ch.slug === currentPost.slug) {


      html += `

      <span class="chapter-number active">

      ${ch.chapter}

      </span>

      `;



    } else {


      html += `

      <a class="chapter-number"
      href="${ch.url}">

      ${ch.chapter}

      </a>

      `;


    }



  });





  // Next button

  if (currentIndex < chapters.length - 1) {


    html += `


    <a class="chapter-btn"
    href="${chapters[currentIndex + 1].url}">


    Next →

    </a>


    `;


  }



  html += '</div>';



  nav.innerHTML = html;

}



function shrinkAd(){

const ad = document.getElementById("topAd");


ad.classList.add("small");


document.body.classList.add("ad-small");


}




function insertParagraphAds(){


const content = document.getElementById("postContent");


if(!content) return;



const paragraphs = Array.from(
content.querySelectorAll("p")
);



paragraphs.forEach((p,index)=>{


if((index + 1) % 1 === 0){



const ad = document.createElement("div");

ad.className = "paragraph-ad";



const box = document.createElement("div");

box.className = "ad-box";



ad.appendChild(box);



p.after(ad);



// load each ad separately

setTimeout(()=>{


const config = document.createElement("script");


config.textContent = `

atOptions = {

'key' : '0be1e382fd37fb22ea434d15f4bb3687',

'format' : 'iframe',

'height' : 250,

'width' : 300,

'params' : {}

};

`;



const script = document.createElement("script");


script.src =
"https://www.highperformanceformat.com/0be1e382fd37fb22ea434d15f4bb3687/invoke.js";



box.appendChild(config);

box.appendChild(script);



}, index * 2000);



}



});


}



/* =====================
AUTO PROMO EVERY 60 SEC
===================== */


function showPromo(){

const banner =
document.getElementById("promoBanner");


if(banner){

banner.style.display="flex";

}


}



function closePromo(){

const banner =
document.getElementById("promoBanner");


if(banner){

banner.style.display="none";

}


}



// first show after 60 seconds

setTimeout(()=>{

showPromo();

},60000);




// repeat every 60 seconds

setInterval(()=>{

showPromo();

},30000);





/* =========================
NAVIGATION POPUP ADS
========================= */


let navigationCount =
Number(sessionStorage.getItem("navigationCount")) || 0;



function showNavigationAd(){

const ad = document.getElementById("navAd");

if(!ad) return;


// show ad

ad.style.display = "flex";



// hide X first

const close =
document.getElementById("navAdClose");


if(close){

close.style.display="none";


setTimeout(()=>{

close.style.display="block";


},5000);


}



}





function closeNavigationAd(){


const ad =
document.getElementById("navAd");


if(ad){

ad.style.display="none";

}


}




function checkNavigationAd(){


// increase movement count

navigationCount++;



sessionStorage.setItem(
"navigationCount",
navigationCount
);




// every 2 page movements

if(navigationCount % 2 === 0){


showNavigationAd();


}



}




// Works on normal click + browser back button

window.addEventListener("pageshow",()=>{


checkNavigationAd();


});

