    import { db } from "./firebase.js";

import{
collection,
query,
where,
orderBy,
getDocs
}from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


//========================================
// SETTINGS
//========================================

const DOMAIN="https://claunecks.com";

const output=document.getElementById("output");
const status=document.getElementById("status");
const generateBtn=document.getElementById("generateBtn");
const copyBtn=document.getElementById("copyBtn");


//========================================
// EVENTS
//========================================

generateBtn.onclick=generateSitemap;

copyBtn.onclick=()=>{

output.select();

document.execCommand("copy");

alert("Sitemap copied.");

};


//========================================
// CREATE SEO SLUG
//========================================

function createSlug(title){

return(title||"post")

.toLowerCase()

.trim()

.replace(/[^\w\s-]/g,"")

.replace(/\s+/g,"-")

.replace(/-+/g,"-")

.substring(0,80);

}


//========================================
// GENERATE SITEMAP
//========================================

async function generateSitemap(){

try{

status.innerHTML="Loading...";

output.value="";

let xml=`<?xml version="1.0" encoding="UTF-8"?>\n`;

xml+=`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;


//========================================
// HOME PAGE
//========================================

xml+=`

<url>

<loc>${DOMAIN}</loc>

<changefreq>daily</changefreq>

<priority>1.0</priority>

</url>

`;


//========================================
// POSTS
//========================================

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

xml+=`

<url>

<loc>${DOMAIN}/post/${slug}--${id}.html</loc>

<changefreq>weekly</changefreq>

<priority>0.8</priority>

</url>

`;

});


//========================================
// GROUP POSTS
//========================================

const groupQuery = query(
    collection(db, "groupPosts")
);
    
const groupSnapshot=await getDocs(groupQuery);

groupSnapshot.forEach(docSnap=>{

const post=docSnap.data();

const id=docSnap.id;

const slug=createSlug(post.title);

xml+=`

<url>

<loc>${DOMAIN}/grouppost/${slug}--${id}.html</loc>

<changefreq>weekly</changefreq>

<priority>0.8</priority>

</url>

`;

});


//========================================
// FINISH
//========================================

xml+=`

</urlset>

`;

output.value=xml;

status.innerHTML=`

Done!

Posts: ${postSnapshot.size}

Group Posts: ${groupSnapshot.size}

Total URLs: ${postSnapshot.size+groupSnapshot.size+1}

`;

}

catch(err){

console.error(err);

status.innerHTML=err.message;

}

         }
