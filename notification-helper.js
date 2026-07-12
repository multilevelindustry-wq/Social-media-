import { db } from "./firebase.js";

import {
collection,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export async function createNotification(data){

await addDoc(

collection(db,"notifications"),

{
...data,
isRead:false,
createdAt:serverTimestamp()
}

);

}


