import { db } from "./firebase.js";

import {
    collection,
    query,
    where,
    orderBy,
    getDocs
}
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const output=document.getElementById("output");

const status=document.getElementById("status");

const generateBtn=document.getElementById("generateBtn");

generateBtn.onclick=generate;



function createSlug(title){

return (title || "post")

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

const zip=new JSZip();



//============================
// POST FOLDER
//============================

const postFolder=zip.folder("post");



//============================
// GROUP POST FOLDER
//============================

const groupFolder=zip.folder("grouppost");



let postCount=0;

let groupCount=0;



//============================
// NORMAL POSTS
//============================

const postQuery=query(

collection(db,"posts"),

where("visibility","==","public"),

orderBy("createdAt","desc")

);

const postSnapshot=await getDocs(postQuery);



postSnapshot.forEach(docSnap=>{

const post=docSnap.data();

const id=docSnap.id;

const slug=createSlug(post.title);



const html=`<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<title>${post.title || "CreatorHub"}</title>

<meta name="robots" content="index,follow">

<meta name="description"

content="${post.description || post.title || ""}">

<link rel="canonical"

href="https://claunecks.com/post.html?id=${id}">

<meta property="og:title"

content="${post.title || ""}">

<meta property="og:type"

content="article">

<meta property="og:url"

content="https://claunecks.com/post.html?id=${id}">

<meta property="og:site_name"

content="CreatorHub">

<meta name="twitter:card"

content="summary_large_image">

<meta http-equiv="refresh"

content="0;url=/post.html?id=${id}">

<script>

const id="${id}";

location.replace("/post.html?id="+id);

</script>

</head>

<body>

Redirecting...

</body>

</html>`;



postFolder.file(

`${slug}--${id}.html`,

html

);

postCount++;

});



//============================
// GROUP POSTS
//============================

status.innerHTML="Loading group posts...";

const groupQuery=query(

collection(db,"groupPosts"),

orderBy("createdAt","desc")

);

const groupSnapshot=await getDocs(groupQuery);



console.log(

"Group posts found:",

groupSnapshot.size

);



groupSnapshot.forEach(docSnap=>{

const group=docSnap.data();

const id=docSnap.id;

const slug=createSlug(group.title);



const html=`<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<title>${group.title || "Group Post"}</title>

<meta name="robots"

content="index,follow">

<meta name="description"

content="${group.description || group.title || ""}">

<link rel="canonical"

href="https://claunecks.com/group-post.html?id=${id}">

<meta property="og:title"

content="${group.title || ""}">

<meta property="og:type"

content="article">

<meta property="og:url"

content="https://claunecks.com/group-post.html?id=${id}">

<meta property="og:site_name"

content="CreatorHub">

<meta name="twitter:card"

content="summary_large_image">

<meta http-equiv="refresh"

content="0;url=/group-post.html?id=${id}">

<script>

const id="${id}";

location.replace("/group-post.html?id="+id);

</script>

</head>

<body>

Redirecting...

</body>

</html>`;



groupFolder.file(

`${slug}--${id}.html`,

html

);

groupCount++;

});

//============================
// CREATE ZIP
//============================

status.innerHTML="Creating ZIP...";

const blob=await zip.generateAsync({

type:"blob",

compression:"DEFLATE",

compressionOptions:{

level:9

}

});

//============================
// DOWNLOAD ZIP
//============================

const url=URL.createObjectURL(blob);

const blob = await zip.generateAsync({
    type: "blob"
});

const url = URL.createObjectURL(blob);

const link = document.createElement("a");

link.href = url;
link.download = "creatorhub-pages.zip";

document.body.appendChild(link);

link.click();

setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
}, 1000);

document.body.removeChild(a);

URL.revokeObjectURL(url);

//============================
// SHOW RESULT
//============================

status.innerHTML=`
Finished!

${postCount} Post pages generated.

${groupCount} Group pages generated.

Total: ${postCount+groupCount}
`;

output.value=`
Posts Generated: ${postCount}

Group Posts Generated: ${groupCount}

Total Redirect Pages: ${postCount+groupCount}

Folders Created:

post/

grouppost/

ZIP File:

creatorhub-pages.zip
`;

}catch(err){

console.error(err);

status.innerHTML="Error: "+err.message;

output.value=err.stack;

}

}


