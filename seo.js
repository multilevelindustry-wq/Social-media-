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
// SCHEMA
//------------------------------------------

buildArticleSchema(

post,

title,

description,

canonical,

image

);



  //------------------------------------------
// MEDIA SCHEMA
//------------------------------------------

buildMediaSchema(

post,

title,

description,

canonical,

image

);



  //------------------------------------------
// FAQ SCHEMA
//------------------------------------------

buildFAQSchema(

post,

title,

description

);


  //------------------------------------------
// ENTITY ENGINE
//------------------------------------------

buildEntitySchema(

post,

title,

description

);


  //------------------------------------------
// INTERNAL LINKING
//------------------------------------------

buildInternalSEO(post);


  //------------------------------------------
// FINAL SEO
//------------------------------------------

buildFinalSEO(

post,

title,

description,

canonical

);

  
  
  //------------------------------------------
// KEYWORDS
//------------------------------------------

const keywords=generateKeywords(post);

setMeta(

"keywords",

keywords.join(", ")

);



  
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

  setCanonical(canonical);

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


//==========================================
// ARTICLE SCHEMA
//==========================================

function buildArticleSchema(

post,

title,

description,

url,

image

){

// Remove old schema
const old=document.getElementById("seo-schema");

if(old){

old.remove();

}

const schema={

"@context":"https://schema.org",

"@type":"Article",

"headline":title,

"description":description,

"url":url,

"mainEntityOfPage":url,

"image":image? [image]:[],

"datePublished":

post.createdAt?.toDate

? post.createdAt.toDate().toISOString()

:new Date().toISOString(),

"dateModified":

post.updatedAt?.toDate

? post.updatedAt.toDate().toISOString()

:

post.createdAt?.toDate

? post.createdAt.toDate().toISOString()

:new Date().toISOString(),

"author":{

"@type":"Person",

"name":post.username||"CreatorHub User"

},

"publisher":{

"@type":"Organization",

"name":"Claunecks",

"logo":{

"@type":"ImageObject",

"url":"https://claunecks.com/logo.png"

}

}

};

const script=document.createElement("script");

script.id="seo-schema";

script.type="application/ld+json";

script.textContent=

JSON.stringify(schema);

document.head.appendChild(script);

  }


//==========================================
// KEYWORD ENGINE
//==========================================

function generateKeywords(post){

const text=[

post.title||"",

post.description||"",

post.content||""

]

.join(" ")

.toLowerCase()

.replace(/[^\w\s]/g," ")

.replace(/\s+/g," ")

.trim();

const words=text

.split(" ")

.filter(w=>w.length>3);

const unique=[];

words.forEach(word=>{

if(!unique.includes(word)){

unique.push(word);

}

});

const base=unique.slice(0,10);

const keywords=[];

base.forEach(word=>{

keywords.push(word);

keywords.push("best "+word);

keywords.push("how to "+word);

keywords.push(word+" guide");

keywords.push(word+" tips");

keywords.push(word+" tutorial");

});

if(post.title){

keywords.push(post.title);

keywords.push(post.title+" guide");

keywords.push("learn "+post.title);

keywords.push("best "+post.title);

}

if(post.mediaType==="image"){

keywords.push("photo");

keywords.push("images");

keywords.push("picture");

}

if(post.mediaType==="video"){

keywords.push("video");

keywords.push("watch video");

keywords.push("viral video");

}

keywords.push("Claunecks");

keywords.push("CreatorHub");

keywords.push("content creator");

keywords.push("social media");

return [...new Set(keywords)].slice(0,20);

}



//==========================================
// MEDIA SCHEMA
//==========================================

function buildMediaSchema(

post,

title,

description,

url,

image

){

if(!post.mediaUrl) return;

//--------------------------------------
// REMOVE OLD MEDIA SCHEMA
//--------------------------------------

const old=document.getElementById(

"media-schema"

);

if(old){

old.remove();

}

let schema;


//--------------------------------------
// VIDEO
//--------------------------------------

if(

post.mediaType==="video"

){

schema={

"@context":"https://schema.org",

"@type":"VideoObject",

"name":title,

"description":description,

"thumbnailUrl":image?[image]:[],

"contentUrl":post.mediaUrl,

"embedUrl":post.mediaUrl,

"uploadDate":

post.createdAt?.toDate

?post.createdAt.toDate().toISOString()

:new Date().toISOString(),

"url":url,

"publisher":{

"@type":"Organization",

"name":"Claunecks"

}

};

}


//--------------------------------------
// IMAGE
//--------------------------------------

else{

schema={

"@context":"https://schema.org",

"@type":"ImageObject",

"name":title,

"description":description,

"contentUrl":post.mediaUrl,

"url":url

};

}


//--------------------------------------
// INSERT
//--------------------------------------

const script=document.createElement("script");

script.type="application/ld+json";

script.id="media-schema";

script.textContent=

JSON.stringify(schema);

document.head.appendChild(script);

  }


//==========================================
// FAQ SCHEMA
//==========================================

function buildFAQSchema(

post,

title,

description

){

//--------------------------------------
// REMOVE OLD FAQ
//--------------------------------------

const old=document.getElementById(

"faq-schema"

);

if(old){

old.remove();

}

//--------------------------------------
// QUESTIONS
//--------------------------------------

const faq={

"@context":"https://schema.org",

"@type":"FAQPage",

"mainEntity":[

{

"@type":"Question",

"name":"What is "+title+"?",

"acceptedAnswer":{

"@type":"Answer",

"text":description

}

},

{

"@type":"Question",

"name":"Why is "+title+" important?",

"acceptedAnswer":{

"@type":"Answer",

"text":description

}

},

{

"@type":"Question",

"name":"How does "+title+" work?",

"acceptedAnswer":{

"@type":"Answer",

"text":description

}

}

]

};

//--------------------------------------
// INSERT
//--------------------------------------

const script=document.createElement(

"script"

);

script.id="faq-schema";

script.type="application/ld+json";

script.textContent=

JSON.stringify(faq);

document.head.appendChild(script);

}


//==========================================
// ENTITY ENGINE
//==========================================

function buildEntitySchema(

post,

title,

description

){

//--------------------------------------
// REMOVE OLD
//--------------------------------------

const old=document.getElementById(

"entity-schema"

);

if(old){

old.remove();

}

//--------------------------------------
// EXTRACT WORDS
//--------------------------------------

const text=(

(post.title||"")+" "+

(post.description||"")+" "+

(post.content||"")

)

.toLowerCase()

.replace(/[^\w\s]/g," ")

.replace(/\s+/g," ")

.trim();

const words=text.split(" ");

const stopWords=[

"the","and","for","with","this","that",

"from","have","your","into","about",

"will","would","could","should",

"been","were","their","there",

"them","then","than","when","what",

"where","which","while","because",

"very","just","also","more","some",

"into","over","under","using"

];

const entities=[];

words.forEach(word=>{

if(

word.length>4 &&

!stopWords.includes(word) &&

!entities.includes(word)

){

entities.push(word);

}

});

//--------------------------------------
// LIMIT
//--------------------------------------

const topics=entities.slice(0,15);

//--------------------------------------
// SCHEMA
//--------------------------------------

const schema={

"@context":"https://schema.org",

"@type":"Thing",

"name":title,

"description":description,

"keywords":topics.join(","),

"about":topics,

"url":window.location.href

};

//--------------------------------------
// INSERT
//--------------------------------------

const script=document.createElement(

"script"

);

script.id="entity-schema";

script.type="application/ld+json";

script.textContent=

JSON.stringify(schema);

document.head.appendChild(script);

  }


//==========================================
// RELATED LINKS SCHEMA
//==========================================

function buildRelatedSchema(posts){

const old=document.getElementById(

"related-schema"

);

if(old){

old.remove();

}

const itemList=[];

posts.forEach((post,index)=>{

itemList.push({

"@type":"ListItem",

"position":index+1,

"url":`${DOMAIN}/post/${createSlug(post.title)}--${post.id}.html`

});

});

const schema={

"@context":"https://schema.org",

"@type":"ItemList",

"itemListElement":itemList

};

const script=document.createElement("script");

script.id="related-schema";

script.type="application/ld+json";

script.textContent=

JSON.stringify(schema);

document.head.appendChild(script);

  }

//==========================================
// INTERNAL LINK ENGINE
//==========================================

async function buildInternalSEO(post){

try{

const keywords=generateKeywords(post);

const q=query(

collection(db,"posts"),

orderBy("createdAt","desc")

);

const snap=await getDocs(q);

const related=[];

snap.forEach(docSnap=>{

if(docSnap.id===postId) return;

const p=docSnap.data();

const text=(

(p.title||"")+" "+

(p.description||"")

).toLowerCase();

let score=0;

keywords.forEach(word=>{

if(text.includes(word.toLowerCase())){

score++;

}

});

if(score>0){

related.push({

id:docSnap.id,

title:p.title,

score

});

}

});

related.sort(

(a,b)=>b.score-a.score

);

buildRelatedSchema(

related.slice(0,10)

);

}

catch(err){

console.log(err);

}

           }


//==========================================
// WEBPAGE SCHEMA
//==========================================

function buildWebPage(

title,

description,

url,

minutes

){

const old=document.getElementById(

"webpage-schema"

);

if(old) old.remove();

const schema={

"@context":"https://schema.org",

"@type":"WebPage",

"name":title,

"description":description,

"url":url,

"inLanguage":"en",

"isPartOf":{

"@type":"WebSite",

"name":"Claunecks",

"url":DOMAIN

},

"timeRequired":

`PT${minutes}M`

};

const script=document.createElement("script");

script.id="webpage-schema";

script.type="application/ld+json";

script.textContent=

JSON.stringify(schema);

document.head.appendChild(script);

  }

//==========================================
// BREADCRUMB
//==========================================

function buildBreadcrumb(

title,

url

){

const old=document.getElementById(

"breadcrumb-schema"

);

if(old) old.remove();

const schema={

"@context":"https://schema.org",

"@type":"BreadcrumbList",

"itemListElement":[

{

"@type":"ListItem",

"position":1,

"name":"Home",

"item":DOMAIN

},

{

"@type":"ListItem",

"position":2,

"name":"Posts",

"item":DOMAIN+"/post.html"

},

{

"@type":"ListItem",

"position":3,

"name":title,

"item":url

}

]

};

const script=document.createElement("script");

script.id="breadcrumb-schema";

script.type="application/ld+json";

script.textContent=

JSON.stringify(schema);

document.head.appendChild(script);

}

//==========================================
// FINAL SEO ENGINE
//==========================================

function buildFinalSEO(

post,

title,

description,

url

){

//--------------------------------------
// LANGUAGE
//--------------------------------------

document.documentElement.lang="en";


//--------------------------------------
// THEME COLOR
//--------------------------------------

setMeta(

"theme-color",

"#ffffff"

);


//--------------------------------------
// AUTHOR
//--------------------------------------

setMeta(

"author",

post.username||"Claunecks Creator"

);


//--------------------------------------
// APPLICATION NAME
//--------------------------------------

setMeta(

"application-name",

"Claunecks"

);


//--------------------------------------
// MOBILE
//--------------------------------------

setMeta(

"apple-mobile-web-app-title",

"Claunecks"

);


//--------------------------------------
// READING TIME
//--------------------------------------

const words=(

post.content||

""

)

.split(/\s+/)

.length;

const minutes=Math.max(

1,

Math.ceil(words/200)

);


//--------------------------------------
// BREADCRUMB SCHEMA
//--------------------------------------

buildBreadcrumb(

title,

url

);


//--------------------------------------
// WEBPAGE SCHEMA
//--------------------------------------

buildWebPage(

title,

description,

url,

minutes

);

}



