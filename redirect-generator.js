import { db } from "./firebase.js";

import {

collection,

query,

where,

orderBy,

getDocs

}

from

"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const output=document.getElementById("output");

document.getElementById("generateBtn").onclick=generate;



async function generate(){

const q=query(

collection(db,"posts"),

where("visibility","==","public"),

orderBy("createdAt","desc")

);

const snapshot=await getDocs(q);

const zip=new JSZip();

const postFolder=zip.folder("post");

let total=0;

snapshot.forEach(docSnap=>{

const post=docSnap.data();

const id=docSnap.id;

const slug=(post.title||"post")

.toLowerCase()

.trim()

.replace(/[^\w\s-]/g,"")

.replace(/\s+/g,"-")

.replace(/-+/g,"-")

.substring(0,80);

const html=`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>${post.title}</title>

<meta http-equiv="refresh"

content="0;url=/post.html?id=${id}">

<script>

location.replace("/post.html?id=${id}");

</script>

</head>

<body>

Redirecting...

</body>

</html>

`;

postFolder.file(

`${slug}--${id}.html`,

html

);

total++;

});

const blob=await zip.generateAsync({

type:"blob"

});

const a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="creatorhub-post-pages.zip";

a.click();

output.value=`${total} redirect pages generated.`;

}

