import { db } from "./firebase.js";

import{

collection,

query,

where,

orderBy,

getDocs

}from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


//=====================================
// SETTINGS
//=====================================

const DOMAIN="https://creatorhub.com";
// Replace with your real domain


const output=document.getElementById("output");

const status=document.getElementById("status");

const generateBtn=document.getElementById("generateBtn");

const copyBtn=document.getElementById("copyBtn");


//=====================================
// BUTTONS
//=====================================

generateBtn.addEventListener(

"click",

generateSitemap

);

copyBtn.addEventListener(

"click",

()=>{

output.select();

document.execCommand("copy");

alert("Sitemap copied.");

}

);


//=====================================
// GENERATE
//=====================================

async function generateSitemap(){

try{

status.innerHTML="Loading public posts...";

output.value="";

const q=query(

collection(db,"posts"),

where("visibility","==","public"),

orderBy("createdAt","desc")

);

const snapshot=await getDocs(q);

status.innerHTML=

`Found ${snapshot.size} public posts. Generating sitemap...`;

let xml=`<?xml version="1.0" encoding="UTF-8"?>\n`;

xml+=`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;


// Homepage

xml+=`

<url>

<loc>${DOMAIN}</loc>

<changefreq>daily</changefreq>

<priority>1.0</priority>

</url>

`;


// Post URLs

snapshot.forEach(docSnap=>{

const post=docSnap.data();

const id=docSnap.id;

// We'll build the URL in Part 3

});

xml+=`\n</urlset>`;

output.value=xml;

status.innerHTML="Ready.";

}

catch(err){

console.error(err);

status.innerHTML=err.message;

}

  }


