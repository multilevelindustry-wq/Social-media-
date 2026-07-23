//==========================================
// SEO ENGINE
// PART 1
//==========================================

import { db } from "./firebase.js";

import {

doc,

getDoc

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


//==========================================
// DOMAIN
//==========================================

const DOMAIN="https://claunecks.com";


//==========================================
// GET POST ID
//==========================================

const params=new URLSearchParams(

window.location.search

);

const postId=params.get("id");


//==========================================
// LOAD SEO
//==========================================

export async function loadSEO(){

if(!postId) return;

try{

const snap=await getDoc(

doc(db,"posts",postId)

);

if(!snap.exists()) return;

const post=snap.data();

buildSEO(post);

}

catch(err){

console.error(

"SEO:",

err

);

}

}


//==========================================
// START
//==========================================

loadSEO();


  //==========================================
// BUILD SEO
// PART 2
//==========================================

function buildSEO(post){

//------------------------------------------
// TITLE
//------------------------------------------

const title=(post.title||"CreatorHub")+" | Claunecks";

document.title=title;


//------------------------------------------
// DESCRIPTION
//------------------------------------------

let description="";

if(post.description){

    description=post.description;

}

else if(post.content){

    description=post.content;

}

else{

    description=post.title;

}

description=description

.replace(/\s+/g," ")

.trim()

.substring(0,160);


//------------------------------------------
// CANONICAL
//------------------------------------------

const slug=createSlug(

post.title||"post"

);

const canonical=

`${DOMAIN}/post/${slug}--${postId}.html`;


//------------------------------------------
// ROBOTS
//------------------------------------------

setMeta(

"robots",

"index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"

);


//------------------------------------------
// DESCRIPTION
//------------------------------------------

setMeta(

"description",

description

);


//------------------------------------------
// CANONICAL
//------------------------------------------

setCanonical(

canonical

);

}



//==========================================
// META
//==========================================

function setMeta(name,content){

let tag=document.querySelector(

`meta[name="${name}"]`

);

if(!tag){

tag=document.createElement("meta");

tag.setAttribute(

"name",

name

);

document.head.appendChild(tag);

}

tag.setAttribute(

"content",

content

);

}



//==========================================
// CANONICAL
//==========================================

function setCanonical(url){

let link=document.querySelector(

'link[rel="canonical"]'

);

if(!link){

link=document.createElement("link");

link.rel="canonical";

document.head.appendChild(link);

}

link.href=url;

}



//==========================================
// SLUG
//==========================================

function createSlug(title){

return(title||"post")

.toLowerCase()

.trim()

.replace(/[^\w\s-]/g,"")

.replace(/\s+/g,"-")

.replace(/-+/g,"-")

.substring(0,80);

}


//------------------------------------------
// IMAGE
//------------------------------------------

const image = post.mediaUrl || "";

//------------------------------------------
// OPEN GRAPH
//------------------------------------------

setProperty(

"og:title",

title

);

setProperty(

"og:description",

description

);

setProperty(

"og:url",

canonical

);

setProperty(

"og:type",

"article"

);

if(image){

setProperty(

"og:image",

image

);

}

setProperty(

"og:site_name",

"Claunecks"

);



//------------------------------------------
// TWITTER
//------------------------------------------

setMeta(

"twitter:card",

image ? "summary_large_image" : "summary"

);

setMeta(

"twitter:title",

title

);

setMeta(

"twitter:description",

description

);

if(image){

setMeta(

"twitter:image",

image

);

  }



//==========================================
// OPEN GRAPH
//==========================================

function setProperty(property,content){

let tag=document.querySelector(

`meta[property="${property}"]`

);

if(!tag){

tag=document.createElement("meta");

tag.setAttribute(

"property",

property

);

document.head.appendChild(tag);

}

tag.setAttribute(

"content",

content);

}


