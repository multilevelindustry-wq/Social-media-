import { auth, db } from "./firebase.js";

import {
onAuthStateChanged,
signOut,
deleteUser,
EmailAuthProvider,
reauthenticateWithCredential,
updatePassword
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
doc,
getDoc,
setDoc,
updateDoc,
addDoc,
collection,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
deleteDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const CLOUD_NAME = "diqrjgobk";
const UPLOAD_PRESET = "starcode";

const photoInput = document.getElementById("photoInput");
const coverInput = document.getElementById("coverInput");

const settingsPhoto=document.getElementById("settingsPhoto");
const coverPreview=document.getElementById("coverPreview");

const username=document.getElementById("username");
const displayName=document.getElementById("displayName");
const bio=document.getElementById("bio");
const website=document.getElementById("website");

const bankName=document.getElementById("bankName");
const accountName=document.getElementById("accountName");
const accountNumber=document.getElementById("accountNumber");
const paypalEmail=document.getElementById("paypalEmail");

const withdrawBalance=document.getElementById("withdrawBalance");

let currentUser;
let currentUserData;


onAuthStateChanged(auth, async(user)=>{

if(!user){

location.href="login.html";

return;

}

currentUser=user;

/* FIXED */
await loadUser();
await loadWithdrawalAccount();

const privateAccount =
document.getElementById("privateAccount");

if(privateAccount){

privateAccount.checked=
currentUserData?.privateAccount || false;

privateAccount.onchange=async()=>{

await updateDoc(

doc(db,"users",currentUser.uid),

{

privateAccount:privateAccount.checked

}

);

};

}

const verificationStatus=
document.getElementById("verificationStatus");

if(verificationStatus){

verificationStatus.textContent=

currentUserData?.verified

?

"✅ Verified Creator"

:

"❌ Not Verified";

}

});


async function loadUser(){

const snap=await getDoc(
doc(db,"users",currentUser.uid)
);

if(!snap.exists()) return;

currentUserData=snap.data();

settingsPhoto.src=
currentUserData.photo ||
"assets/default-avatar.png";

coverPreview.src=
currentUserData.coverPhoto ||
"assets/default-cover.jpg";

username.value=
currentUserData.username || "";

displayName.value=
currentUserData.displayName || "";

bio.value=
currentUserData.bio || "";

website.value=
currentUserData.website || "";

if(withdrawBalance){

withdrawBalance.textContent=
"$"+((currentUserData.totalIncome)||0).toFixed(2);

}

}



async function loadWithdrawalAccount(){

const snap=await getDoc(
doc(db,"withdrawAccounts",currentUser.uid)
);

if(!snap.exists()) return;

const data=snap.data();

bankName.value=data.bankName || "";

accountName.value=data.accountName || "";

accountNumber.value=data.accountNumber || "";

paypalEmail.value=data.paypalEmail || "";

}



async function uploadToCloudinary(file){

if(!file) return null;

const formData = new FormData();

formData.append("file", file);

formData.append("upload_preset", UPLOAD_PRESET);

const response = await fetch(

`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,

{

method:"POST",

body:formData

}

);

const data = await response.json();

if(!response.ok){

throw new Error(data.error?.message || "Image upload failed.");

}

return data.secure_url;

}

// ==========================
// PROFILE PHOTO PREVIEW
// ==========================

photoInput.addEventListener("change",()=>{

const file = photoInput.files[0];

if(!file) return;

const reader = new FileReader();

reader.onload = e=>{

settingsPhoto.src = e.target.result;

};

reader.readAsDataURL(file);

});


// ==========================
// COVER PHOTO PREVIEW
// ==========================

coverInput.addEventListener("change",()=>{

const file = coverInput.files[0];

if(!file) return;

const reader = new FileReader();

reader.onload = e=>{

coverPreview.src = e.target.result;

};

reader.readAsDataURL(file);

});


document.getElementById("saveProfileBtn")
.addEventListener("click", async()=>{

try{

let photoUrl = currentUserData.photo || "";

let coverUrl = currentUserData.coverPhoto || "";

// Upload profile picture
if(photoInput.files.length){

photoUrl = await uploadToCloudinary(
photoInput.files[0]
);

settingsPhoto.src = photoUrl;

}

// Upload cover photo
if(coverInput.files.length){

coverUrl = await uploadToCloudinary(
coverInput.files[0]
);

coverPreview.src = coverUrl;

}

// Save everything to Firestore
await updateDoc(

doc(db,"users",currentUser.uid),

{

username:username.value.trim(),

displayName:displayName.value.trim(),

bio:bio.value.trim(),

website:website.value.trim(),

photo:photoUrl,

coverPhoto:coverUrl

}

);

// Update local copy
currentUserData.photo = photoUrl;

currentUserData.coverPhoto = coverUrl;

currentUserData.username = username.value.trim();

currentUserData.displayName = displayName.value.trim();

currentUserData.bio = bio.value.trim();

currentUserData.website = website.value.trim();

alert("Profile updated successfully.");

}catch(err){

alert(err.message);

}

});


document.getElementById("saveBankBtn")
.addEventListener("click",async()=>{

if(

!bankName.value ||

!accountName.value ||

!accountNumber.value

){

alert("Please complete your withdrawal account.");

return;

}

await setDoc(

doc(db,"withdrawAccounts",currentUser.uid),

{

uid:currentUser.uid,

bankName:bankName.value.trim(),

accountName:accountName.value.trim(),

accountNumber:accountNumber.value.trim(),

paypalEmail:paypalEmail.value.trim(),

updatedAt:serverTimestamp()

}

);

alert("Withdrawal account saved successfully.");

});



document.getElementById("withdrawBtn")
.addEventListener("click",async()=>{

const amount=Number(
document.getElementById("withdrawAmount").value
);

if(!amount || amount<=0){

alert("Enter a valid amount.");

return;

}

const userSnap=await getDoc(
doc(db,"users",currentUser.uid)
);

const user=userSnap.data();

const balance=user.totalIncome||0;

if(amount>balance){

alert("Insufficient balance.");

return;

}

const bankSnap=await getDoc(
doc(db,"withdrawAccounts",currentUser.uid)
);

if(!bankSnap.exists()){

alert("Please add your withdrawal account first.");

return;

}

const bank=bankSnap.data();

await addDoc(

collection(db,"withdrawRequests"),

{

uid:currentUser.uid,

username:user.username,

photo:user.photo,

amount,

status:"Pending",

bankName:bank.bankName,

accountName:bank.accountName,

accountNumber:bank.accountNumber,

paypalEmail:bank.paypalEmail,

createdAt:serverTimestamp()

}

);

await updateDoc(

doc(db,"users",currentUser.uid),

{

totalIncome:balance-amount

}

);

document.getElementById("withdrawAmount").value="";

if(withdrawBalance){

withdrawBalance.textContent=
"$"+(balance-amount).toFixed(2);

}

alert("Withdrawal request submitted.");

});



document.getElementById("changePasswordBtn")
.addEventListener("click",async()=>{

const newPassword=
document.getElementById("newPassword")
.value.trim();

if(newPassword.length<6){

alert("Password must be at least 6 characters.");

return;

}

try{

await updatePassword(
currentUser,
newPassword
);

document.getElementById("newPassword").value="";

alert("Password updated successfully.");

}catch(err){

alert(err.message);

}

});



document.getElementById("logoutBtn")
.addEventListener("click",async()=>{

const ok=confirm("Logout now?");

if(!ok) return;

await signOut(auth);

location.href="login.html";

});


document.getElementById("deleteAccountBtn")
.addEventListener("click",async()=>{

const answer=confirm(
"This action is permanent.\nDelete your account?"
);

if(!answer) return;

const password=prompt(
"Enter your password to continue"
);

if(!password) return;

try{

const credential=
EmailAuthProvider.credential(
currentUser.email,
password
);

await reauthenticateWithCredential(
currentUser,
credential
);

await deleteDoc(
doc(db,"users",currentUser.uid)
);

await deleteUser(currentUser);

alert("Account deleted.");

location.href="login.html";

}catch(err){

alert(err.message);

}

});




// ==========================
// LOGOUT
// ==========================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

logoutBtn.addEventListener("click", async () => {

const ok = confirm("Logout now?");

if (!ok) return;

await signOut(auth);

location.href = "login.html";

});

}


// ==========================
// DELETE ACCOUNT
// ==========================

const deleteAccountBtn =
document.getElementById("deleteAccountBtn");

if (deleteAccountBtn) {

deleteAccountBtn.addEventListener("click", async () => {

const answer = confirm(
"This action is permanent.\nDelete your account?"
);

if (!answer) return;

const password = prompt(
"Enter your password to continue"
);

if (!password) return;

try {

const credential =
EmailAuthProvider.credential(
currentUser.email,
password
);

await reauthenticateWithCredential(
currentUser,
credential
);

await deleteDoc(
doc(db, "users", currentUser.uid)
);

await deleteUser(currentUser);

alert("Account deleted successfully.");

location.href = "login.html";

} catch (err) {

alert(err.message);

}

});

}


// ==========================
// DARK MODE
// ==========================

const darkMode =
document.getElementById("darkMode");

if (darkMode) {

if (localStorage.getItem("theme") === "dark") {

document.body.classList.add("dark");

darkMode.checked = true;

}

darkMode.addEventListener("change", () => {

if (darkMode.checked) {

document.body.classList.add("dark");

localStorage.setItem("theme", "dark");

} else {

document.body.classList.remove("dark");

localStorage.setItem("theme", "light");

}

});

}


// ==========================
// PUSH NOTIFICATIONS
// ==========================

const push =
document.getElementById("pushNotifications");

if (push) {

push.checked =
localStorage.getItem("pushNotifications") !== "off";

push.onchange = () => {

localStorage.setItem(
"pushNotifications",
push.checked ? "on" : "off"
);

};

}


// ==========================
// EMAIL NOTIFICATIONS
// ==========================

const email =
document.getElementById("emailNotifications");

if (email) {

email.checked =
localStorage.getItem("emailNotifications") !== "off";

email.onchange = () => {

localStorage.setItem(
"emailNotifications",
email.checked ? "on" : "off"
);

};

}


// ==========================
// LANGUAGE
// ==========================

const language =
document.getElementById("language");

if (language) {

language.value =
localStorage.getItem("language") || "en";

language.onchange = () => {

localStorage.setItem(
"language",
language.value
);

alert("Language saved.");

};

}