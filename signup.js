import { auth, db, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "./firebase.js";

import {
createUserWithEmailAndPassword,
updateProfile
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
doc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const signupForm=document.getElementById("signupForm");

const profileImage=document.getElementById("profileImage");

const previewImage=document.getElementById("previewImage");

let imageFile=null;

profileImage.addEventListener("change",(e)=>{

imageFile=e.target.files[0];

if(imageFile){

previewImage.src=URL.createObjectURL(imageFile);

}

});

async function uploadProfileImage(file){

if(!file){

return "assets/default-avatar.png";

}

const formData=new FormData();

formData.append("file",file);

formData.append("upload_preset",CLOUDINARY_UPLOAD_PRESET);

const response=await fetch(

`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,

{

method:"POST",

body:formData

}

);

const data=await response.json();

return data.secure_url;

}

signupForm.addEventListener("submit",async(e)=>{

e.preventDefault();

const fullName=document.getElementById("fullName").value.trim();

const username=document.getElementById("username").value.trim();

const email=document.getElementById("email").value.trim();

const password=document.getElementById("password").value;

try{

const imageURL=await uploadProfileImage(imageFile);

const userCredential=await createUserWithEmailAndPassword(

auth,

email,

password

);

const user=userCredential.user;

await updateProfile(user,{

displayName:fullName,

photoURL:imageURL

});

await setDoc(doc(db,"users",user.uid),{

uid:user.uid,

name:fullName,

username:username,

email:email,

photo:imageURL,

coverPhoto:"assets/default-cover.jpg",

bio:"",

verified:false,

online:true,

lastSeen:serverTimestamp(),

joined:serverTimestamp(),

joinedAt:serverTimestamp(),

followers:[],

following:[],

followersCount:0,

followingCount:0,

totalViews:0,

totalPosts:0,

totalIncome:0

});

alert("Account created successfully!");

window.location.href="dashboard.html";

}catch(error){

alert(error.message);

}

});