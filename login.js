import { auth, db } from "./firebase.js";

import {
signInWithEmailAndPassword,
setPersistence,
browserLocalPersistence,
browserSessionPersistence,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
doc,
updateDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const loginForm=document.getElementById("loginForm");

const remember=document.getElementById("remember");

onAuthStateChanged(auth,async(user)=>{

if(user){

try{

await updateDoc(doc(db,"users",user.uid),{

online:true,

lastSeen:serverTimestamp()

});

}catch(error){

console.log(error);

}

window.location.href="index.html";

}

});

loginForm.addEventListener("submit",async(e)=>{

e.preventDefault();

const email=document.getElementById("email").value.trim();

const password=document.getElementById("password").value;

try{

await setPersistence(

auth,

remember.checked

? browserLocalPersistence

: browserSessionPersistence

);

const userCredential=

await signInWithEmailAndPassword(

auth,

email,

password

);

await updateDoc(

doc(db,"users",userCredential.user.uid),

{

online:true,

lastSeen:serverTimestamp()

}

);

window.addEventListener("beforeunload",async()=>{

try{

await updateDoc(

doc(db,"users",userCredential.user.uid),

{

online:false,

lastSeen:serverTimestamp()

}

);

}catch(error){

console.log(error);

}

});

alert("Login Successful!");

window.location.href="index.html";

}catch(error){

alert(error.message);

}

});

