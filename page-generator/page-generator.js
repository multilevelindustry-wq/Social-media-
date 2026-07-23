import { db } from "../js/firebase.js";

import {

collection,

query,

where,

orderBy,

getDocs

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {

buildRedirectPage

} from "./page-template.js";

const generated = [];

async function generateNewPages(){

    const q = query(

        collection(db,"posts"),

        where("visibility","==","public"),

        orderBy("createdAt","desc")

    );

    const snapshot = await getDocs(q);

    let htmlOutput = "";

    snapshot.forEach(docSnap=>{

        const post = docSnap.data();

        post.postId = docSnap.id;

        //----------------------------------
        // Skip if already generated
        //----------------------------------

        if(generated.includes(post.postId)){

            return;

        }

        //----------------------------------
        // Build page
        //----------------------------------

        const page = buildRedirectPage(post);

        //----------------------------------
        // Show filename
        //----------------------------------

        htmlOutput +=
`=========================================
FILE:

post/${post.postId}.html

=========================================

${page}


`;

        generated.push(post.postId);

    });

    document.getElementById("output").value = htmlOutput;

}

window.generateNewPages = generateNewPages;



