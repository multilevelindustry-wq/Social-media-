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

//-------------------------------------
// POSTS
//-------------------------------------

snapshot.forEach(docSnap=>{

    const post=docSnap.data();

    const id=docSnap.id;

    //---------------------------------
    // TITLE
    //---------------------------------

    let title=(post.title || "post")

    .toLowerCase()

    .trim();

    //---------------------------------
    // REMOVE SPECIAL CHARACTERS
    //---------------------------------

    title=title

    .replace(/[^\w\s-]/g,"")

    .replace(/\s+/g,"-")

    .replace(/-+/g,"-")

    .substring(0,80);

    //---------------------------------
    // URL
    //---------------------------------

    const url=

`${DOMAIN}/${title}-${id}.html`;

    //---------------------------------
    // LASTMOD
    //---------------------------------

    let lastmod="";

    if(post.createdAt?.toDate){

        lastmod=

post.createdAt

.toDate()

.toISOString();

    }

    //---------------------------------
    // ADD TO XML
    //---------------------------------

    xml += `

<url>

<loc>${url}</loc>

<lastmod>${lastmod}</lastmod>

<changefreq>${changefreq}</changefreq>

<priority>${priority}</priority>

</url>

`;

});

//-------------------------------------
// GROUP POSTS
//-------------------------------------

const groupQuery = query(

    collection(db,"groupPosts"),

    where("visibility","==","public"),

    orderBy("createdAt","desc")

);

const groupSnapshot = await getDocs(groupQuery);

status.innerHTML =

`Generating ${snapshot.size} posts and ${groupSnapshot.size} group posts...`;

groupSnapshot.forEach(docSnap=>{

    const post = docSnap.data();

    const id = docSnap.id;

    //---------------------------------
    // TITLE
    //---------------------------------

    let title = (post.title || "group-post")

    .toLowerCase()

    .trim();

    //---------------------------------
    // CLEAN TITLE
    //---------------------------------

    title = title

    .replace(/[^\w\s-]/g,"")

    .replace(/\s+/g,"-")

    .replace(/-+/g,"-")

    .substring(0,80);

    //---------------------------------
    // URL
    //---------------------------------

    const url =

`${DOMAIN}/group-${title}-${id}.html`;

    //---------------------------------
    // LASTMOD
    //---------------------------------

    let lastmod="";

    if(post.createdAt?.toDate){

        lastmod =

        post.createdAt

        .toDate()

        .toISOString();

    }

    //---------------------------------
    // XML
    //---------------------------------

    xml += `

<url>

<loc>${url}</loc>

<lastmod>${lastmod}</lastmod>

<changefreq>${changefreq}</changefreq>

<priority>${priority}</priority>

</url>

`;

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


//---------------------------------
// PRIORITY
//---------------------------------

let priority="0.6";

const views=post.views || 0;

if(views>=100000){

    priority="1.0";

}

else if(views>=10000){

    priority="0.9";

}

else if(views>=1000){

    priority="0.8";

}

else if(views>=100){

    priority="0.7";

}



//---------------------------------
// CHANGEFREQ
//---------------------------------

let changefreq="monthly";

const comments=post.comments || 0;

if(comments>=100){

    changefreq="daily";

}

else if(comments>=20){

    changefreq="weekly";

}


