(function(){

const titleElement=document.querySelector(".articleTitle");
const article=document.querySelector(".articleContent");

if(!titleElement||!article)return;

const title=titleElement.innerText.trim();

const text=article.innerText.replace(/\s+/g," ").trim();

article.style.whiteSpace="pre-wrap";
article.style.lineHeight="1.9";

function description(txt){
return txt.substring(0,160).trim()+"...";
}

function slug(str){
return str.toLowerCase()
.replace(/[^a-z0-9\s-]/g,"")
.replace(/\s+/g,"-")
.replace(/-+/g,"-");
}

function keywords(txt){

const stopWords=[
"the","and","of","to","a","in","is","for","on","with","that","this",
"you","your","it","be","as","at","by","or","an","are","from","how",
"can","will","into","about","more","their","they","was","were"
];

const words=txt.toLowerCase()
.replace(/[^a-z0-9\s]/g," ")
.split(/\s+/);

const count={};

words.forEach(word=>{

if(word.length<4)return;
if(stopWords.includes(word))return;

count[word]=(count[word]||0)+1;

});

const sorted=Object.entries(count)
.sort((a,b)=>b[1]-a[1])
.slice(0,80)
.map(e=>e[0]);

let result=[];

sorted.forEach(word=>{

result.push(word);
result.push(word+" guide");
result.push(word+" tips");
result.push("best "+word);
result.push("how to "+word);
result.push(word+" for beginners");

});

return [...new Set(result)].join(", ");

}

document.title=title+" | CreatorHub";

document.querySelector('meta[name="description"]')
.setAttribute("content",description(text));

document.querySelector('meta[name="keywords"]')
.setAttribute("content",keywords(text));

const url="https://claunecks.com/"+slug(title)+".html";

const canonical=document.querySelector("link[rel='canonical']");

if(canonical) canonical.href=url;

const words=text.split(/\s+/).length;

const minutes=Math.max(1,Math.ceil(words/200));

const articleMeta=document.querySelector(".articleMeta");

articleMeta.innerHTML=`Published • CreatorHub Team • ${words} words • ${minutes} min read`;

function addMeta(property,content){

let tag=document.querySelector(`meta[property="${property}"]`);

if(!tag){

tag=document.createElement("meta");

tag.setAttribute("property",property);

document.head.appendChild(tag);

}

tag.content=content;

}

addMeta("og:title",title);
addMeta("og:description",description(text));
addMeta("og:url",url);
addMeta("og:type","article");

function addTwitter(name,content){

let tag=document.querySelector(`meta[name="${name}"]`);

if(!tag){

tag=document.createElement("meta");

tag.setAttribute("name",name);

document.head.appendChild(tag);

}

tag.content=content;

}

addTwitter("twitter:card","summary_large_image");
addTwitter("twitter:title",title);
addTwitter("twitter:description",description(text));

})();

const popup=document.getElementById("creatorPopup");

function showPopup(){
popup.style.display="block";
}

function closePopup(){
popup.style.display="none";
}

showPopup();

setInterval(showPopup,140000);
