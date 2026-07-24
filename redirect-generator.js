import { db } from "./firebase.js";

import{

collection,
query,
where,
orderBy,
getDocs

}

from

"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const output=document.getElementById("output");

const status=document.getElementById("status");

document

.getElementById("generateBtn")

.onclick=generate;

function slugify(title){

return(title||"post")

.toLowerCase()

.trim()

.replace(/[^\w\s-]/g,"")

.replace(/\s+/g,"-")

.replace(/-+/g,"-")

.substring(0,80);

}

async function generate(){

try{

status.innerHTML="Loading posts...";

output.value="";

const q=query(

collection(db,"posts"),

where("visibility","==","public"),

orderBy("createdAt","desc")

);

const snapshot=await getDocs(q);

const zip=new JSZip();

const folder=zip.folder("post");

let total=0;

snapshot.forEach(docSnap=>{

const post=docSnap.data();

const id=docSnap.id;

const slug=slugify(post.title);

const html=`<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">

<title>${post.title} | CreatorHub</title>

<meta name="robots"
content="index,follow">

<meta name="description"
content="${post.description||post.title}">

<link rel="canonical"
href="https://claunecks.com/post.html?id=${id}">

<meta property="og:title"
content="${post.title}">

<meta property="og:description"
content="${post.description||""}">

<meta property="og:type"
content="article">

<meta property="og:url"
content="https://claunecks.com/post.html?id=${id}">

<meta property="og:image"
content="${post.mediaUrl||""}">

<meta name="twitter:card"
content="summary_large_image">

<script>

const id="${id}";

location.replace("/post.html?id="+id);

</script>

</head>

<body>

</body>

</html>`;

folder.file(

`${slug}--${id}.html`,

html

);

output.value+=`${slug}--${id}.html\n`;

total++;

});

status.innerHTML="Creating ZIP...";

const blob=await zip.generateAsync({

type:"blob"

});

const a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="creatorhub-post-pages.zip";

a.click();

URL.revokeObjectURL(a.href);

status.innerHTML=

`Finished!

${total} redirect pages generated.

Download started.`;

}

catch(err){

console.error(err);

status.innerHTML=err.message;

}

  }
