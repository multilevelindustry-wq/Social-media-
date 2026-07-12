import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    updateDoc,
    increment,
    serverTimestamp,
    runTransaction,
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/* ==========================================
   CURRENT USER
========================================== */

export function getCurrentUser() {

    return auth.currentUser;

}


/* ==========================================
   SEND NOTIFICATION
========================================== */
export async function sendNotification({

    receiverUid,
    senderUid,
    type,
    postId = null,
    message = ""

}) {

    if (!receiverUid) return;

    if (receiverUid === senderUid) return;

    const senderSnap = await getDoc(
        doc(db, "users", senderUid)
    );

    let username = "Someone";
    let photo = "assets/default-avatar.png";

    if (senderSnap.exists()) {

        const sender = senderSnap.data();

        username =
            sender.username ||
            sender.displayName ||
            "Someone";

        photo =
            sender.photo ||
            sender.photoURL ||
            "assets/default-avatar.png";

    }

    let title = "Notification";
    let finalMessage = message;

    switch (type) {

        case "like":

            title = "New Like";

            if (!finalMessage)
                finalMessage = "liked your post ❤️";

            break;

        case "comment":

            title = "New Comment";

            if (!finalMessage)
                finalMessage = "commented on your post 💬";

            break;

        case "reply":

            title = "New Reply";

            if (!finalMessage)
                finalMessage = "replied to your comment";

            break;

        case "follow":

            title = "New Follower";

            if (!finalMessage)
                finalMessage = "started following you.";

            break;

        case "share":

            title = "New Share";

            if (!finalMessage)
                finalMessage = "shared your post.";

            break;

        case "save":

            title = "Post Saved";

            if (!finalMessage)
                finalMessage = "saved your post.";

            break;

        case "story":

            title = "Story Reaction";

            if (!finalMessage)
                finalMessage = "reacted to your story.";

            break;

        case "storyReply":

            title = "Story Reply";

            if (!finalMessage)
                finalMessage = "replied to your story.";

            break;

        case "message":

            title = "New Message";

            if (!finalMessage)
                finalMessage = "sent you a message.";

            break;

        case "live":

            title = "Live Notification";

            if (!finalMessage)
                finalMessage = "started a live stream.";

            break;

        case "group":

            title = "Group Notification";

            if (!finalMessage)
                finalMessage = "posted in your group.";

            break;

        default:

            title = "Notification";

            if (!finalMessage)
                finalMessage = "sent you a notification.";

    }

    await addDoc(collection(db, "notifications"), {

        receiverUid,
        senderUid,

        senderName: username,
        senderPhoto: photo,

        title,
        message: finalMessage,

        type,
        postId,

        isRead: false,

        createdAt: serverTimestamp()

    });

}




/* ==========================================
   TOGGLE LIKE
========================================== */

export async function toggleLike(postId) {

    const currentUser = auth.currentUser;

    if (!currentUser) return;

    const postRef = doc(db, "posts", postId);

    const likeRef = doc(
        db,
        "posts",
        postId,
        "likes",
        currentUser.uid
    );

    await runTransaction(db, async (transaction) => {

        const postSnap = await transaction.get(postRef);

        if (!postSnap.exists()) return;

        const post = postSnap.data();

        const likeSnap = await transaction.get(likeRef);

        if (likeSnap.exists()) {

            transaction.delete(likeRef);

            transaction.update(postRef, {
                likes: increment(-1)
            });

            transaction.update(
                doc(db, "users", post.uid),
                {
                    totalLikes: increment(-1)
                }
            );

        } else {

            transaction.set(likeRef, {

                uid: currentUser.uid,

                createdAt: serverTimestamp()

            });

            transaction.update(postRef, {
                likes: increment(1)
            });

            transaction.update(
                doc(db, "users", post.uid),
                {
                    totalLikes: increment(1)
                }
            );

        }

    });

    const postSnap = await getDoc(postRef);

    const post = postSnap.data();

    await sendNotification({

        receiverUid: post.uid,

        senderUid: currentUser.uid,

        type: "like",

        postId,

        message: "liked your post ❤️"

    });

}



/* ==========================================
   CHECK IF POST IS LIKED
========================================== */

export async function checkIfLiked(postId) {

    const currentUser = auth.currentUser;

    if (!currentUser) return false;

    const likeRef = doc(
        db,
        "posts",
        postId,
        "likes",
        currentUser.uid
    );

    const likeSnap = await getDoc(likeRef);

    return likeSnap.exists();

}



/* ==========================================
   TOGGLE FOLLOW
========================================== */

export async function toggleFollow(creatorUid){

    const user = getCurrentUser();

    if(!user) return;

    if(user.uid === creatorUid) return;

    const followingRef = doc(
        db,
        "users",
        user.uid,
        "following",
        creatorUid
    );

    const followerRef = doc(
        db,
        "users",
        creatorUid,
        "followers",
        user.uid
    );

    const creatorRef = doc(
        db,
        "users",
        creatorUid
    );

    const userRef = doc(
        db,
        "users",
        user.uid
    );

    await runTransaction(db, async(transaction)=>{

        const followingSnap = await transaction.get(followingRef);

        if(followingSnap.exists()){

            transaction.delete(followingRef);

            transaction.delete(followerRef);

            transaction.update(userRef,{
                following: increment(-1)
            });

            transaction.update(creatorRef,{
                followers: increment(-1)
            });

        }else{

            transaction.set(followingRef,{
                uid: creatorUid,
                createdAt: serverTimestamp()
            });

            transaction.set(followerRef,{
                uid: user.uid,
                createdAt: serverTimestamp()
            });

            transaction.update(userRef,{
                following: increment(1)
            });

            transaction.update(creatorRef,{
                followers: increment(1)
            });

        }

    });

    await sendNotification({

        receiverUid: creatorUid,

        senderUid: user.uid,

        type: "follow",

        message: "started following you"

    });

}




/* ==========================================
   CHECK FOLLOWING
========================================== */

export async function checkIfFollowing(creatorUid){

    const user = getCurrentUser();

    if(!user) return false;

    const followingRef = doc(

        db,

        "users",

        user.uid,

        "following",

        creatorUid

    );

    const snap = await getDoc(followingRef);

    return snap.exists();

}





/* ==========================================
   TOGGLE SAVE POST
========================================== */

export async function toggleSave(postId){

    const user = getCurrentUser();

    if(!user) return;

    const saveRef = doc(

        db,

        "users",

        user.uid,

        "savedPosts",

        postId

    );

    const postRef = doc(

        db,

        "posts",

        postId

    );

    await runTransaction(db, async(transaction)=>{

        const saveSnap = await transaction.get(saveRef);

        if(saveSnap.exists()){

            transaction.delete(saveRef);

            transaction.update(postRef,{

                saves: increment(-1)

            });

        }else{

            transaction.set(saveRef,{

                postId,

                createdAt: serverTimestamp()

            });

            transaction.update(postRef,{

                saves: increment(1)

            });

        }

    });

}




/* ==========================================
   CHECK IF SAVED
========================================== */

export async function checkIfSaved(postId){

    const user = getCurrentUser();

    if(!user) return false;

    const saveRef = doc(

        db,

        "users",

        user.uid,

        "savedPosts",

        postId

    );

    const snap = await getDoc(saveRef);

    return snap.exists();

}





/* ==========================================
   SHARE POST
========================================== */

export async function sharePost(postId){

    const user = getCurrentUser();

    if(!user) return;

    const postRef = doc(db,"posts",postId);

    const postSnap = await getDoc(postRef);

    if(!postSnap.exists()) return;

    const post = postSnap.data();

    await updateDoc(postRef,{

        shares: increment(1)

    });

    const shareUrl = `${location.origin}/post.html?id=${postId}`;

    if(navigator.share){

        try{

            await navigator.share({

                title: post.title,

                text: post.description,

                url: shareUrl

            });

        }catch(err){

            console.log(err);

        }

    }else{

        await navigator.clipboard.writeText(shareUrl);

        alert("Post link copied to clipboard.");

    }

    await sendNotification({

        receiverUid: post.uid,

        senderUid: user.uid,

        type: "share",

        postId,

        message: "shared your post"

    });

}



/* ==========================================
   RECORD VIEW
========================================== */

export async function recordView(postId) {

    const user = getCurrentUser();

    if (!user) return;

    const postRef = doc(db, "posts", postId);

    const viewRef = doc(
        db,
        "posts",
        postId,
        "views",
        user.uid
    );

    await runTransaction(db, async (transaction) => {

        const viewed = await transaction.get(viewRef);

        if (viewed.exists()) {
            return;
        }

        const postSnap = await transaction.get(postRef);

        if (!postSnap.exists()) return;

        const post = postSnap.data();

        transaction.set(viewRef, {
            uid: user.uid,
            createdAt: serverTimestamp()
        });

        transaction.update(postRef, {
            views: increment(1)
        });

        transaction.update(
            doc(db, "users", post.uid),
            {
                totalViews: increment(1)
            }
        );

    });

}



function renderNotification(id, data) {

    const time = data.createdAt?.toDate().toLocaleString() || "";

    const senderName = data.senderName || "Someone";

    const senderPhoto =
        data.senderPhoto ||
        "assets/default-avatar.png";

    let title = data.title;

    if (!title) {

        switch (data.type) {

            case "like":
                title = "New Like";
                break;

            case "comment":
                title = "New Comment";
                break;

            case "follow":
                title = "New Follower";
                break;

            case "share":
                title = "New Share";
                break;

            case "message":
                title = "New Message";
                break;

            default:
                title = "Notification";

        }

    }

    const message = data.message ||
        `${senderName} sent you a notification`;

    notificationsList.innerHTML += `

    <div
        class="notificationCard ${data.isRead ? "read" : "unread"}"
        data-id="${id}"
        data-type="${data.type}"
        data-post="${data.postId || ""}"
        data-group="${data.groupId || ""}"
        data-chat="${data.chatId || ""}"
        data-user="${data.senderUid || ""}">

        <img
            class="notificationAvatar"
            src="${senderPhoto}"
            onerror="this.src='assets/default-avatar.png'">

        <div class="notificationContent">

            <h3>${title}</h3>

            <p>

                <strong>${senderName}</strong>

                ${message}

            </p>

            <div class="notificationTime">

                ${time}

            </div>

        </div>

        <span class="notificationType">

            ${data.type}

        </span>

    </div>

    `;

}