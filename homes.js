import { auth, db } from "./firebase.js";

import {
    toggleLike,
    checkIfLiked,
    toggleFollow,
    checkIfFollowing,
    toggleSave,
    checkIfSaved,
    sharePost,
    recordView
} from "./social.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


/* ==========================================
   GLOBAL VARIABLES
========================================== */

const postsContainer = document.getElementById("postsContainer");
const searchInput = document.getElementById("searchInput");

let currentUser = null;


/* ==========================================
   AUTH
========================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "login.html";
        return;

    }

    currentUser = user;

    await loadPosts();

    listenNotificationBadge();

});


/* ==========================================
   LOAD POSTS
========================================== */

async function loadPosts() {

    postsContainer.innerHTML = `
        <div class="loadingFeed">
            Loading posts...
        </div>
    `;

    try {

        const q = query(

            collection(db, "posts"),

            orderBy("createdAt", "desc"),

            limit(20)

        );

        const snapshot = await getDocs(q);

        postsContainer.innerHTML = "";

        if (snapshot.empty) {

            postsContainer.innerHTML = `

                <div class="emptyFeed">

                    <h3>No posts available.</h3>

                    <p>Be the first to create a post.</p>

                </div>

            `;

            return;

        }

        snapshot.forEach((docSnap) => {

            const post = docSnap.data();

            if (!post.postId) {

                post.postId = docSnap.id;

            }

            createPostCard(post);

        });

    } catch (err) {

        console.error("Failed loading posts:", err);

        postsContainer.innerHTML = `

            <div class="emptyFeed">

                Failed to load posts.

            </div>

        `;

    }

}




/* ==========================================
   CREATE POST CARD
========================================== */

async function createPostCard(post) {

    const card = document.createElement("div");
    card.className = "postCard";

    card.innerHTML = `

    <div class="postHeader">

        <div class="postUser">

            <img
                class="postAvatar"
                src="${post.userPhoto || "assets/default-avatar.png"}"
                alt="Profile">

            <div class="postUserInfo">

                <h3>

                    <a href="profile.html?uid=${post.uid}">

                        ${post.username || "Unknown User"}

                    </a>

                </h3>

                <p>${timeAgo(post.createdAt)}</p>

            </div>

        </div>

        <button
            class="followBtn"
            data-user="${post.uid}">

            Follow

        </button>

    </div>

    <div class="postBody">

        ${post.title ? `
            <h2 class="postTitle">
                ${post.title}
            </h2>
        ` : ""}

        ${post.description ? `
              <p class="postPreview">
    ${post.description}
</p>
        ` : ""}

        ${renderMedia(post)}

    </div>

    ${renderFooter(post)}

    `;

    postsContainer.appendChild(card);

    /* ---------- Restore Like ---------- */

    const likeBtn = card.querySelector(".likeBtn");

    if (await checkIfLiked(post.postId)) {

        likeBtn.innerHTML = "❤️ Liked";
        likeBtn.classList.add("liked");

    }

    /* ---------- Restore Save ---------- */

    const saveBtn = card.querySelector(".saveBtn");

    if (await checkIfSaved(post.postId)) {

        saveBtn.innerHTML = "📌 Saved";
        saveBtn.classList.add("saved");

    }

    /* ---------- Restore Follow ---------- */

    const followBtn = card.querySelector(".followBtn");

    if (currentUser.uid === post.uid) {

        followBtn.style.display = "none";

    } else {

        if (await checkIfFollowing(post.uid)) {

            followBtn.innerHTML = "Following";
            followBtn.classList.add("following");

        }

    }

}


/* ==========================================
   RENDER MEDIA
========================================== */

function renderMedia(post) {

    if (!post.mediaUrl) return "";

    if (post.mediaType === "image") {

        return `

        <div class="postMedia">

            <img
                loading="lazy"
                src="${post.mediaUrl}"
                alt="Post Image">

        </div>

        `;

    }

    return `

    <div class="postMedia">

        <video
            controls
            preload="metadata">

            <source src="${post.mediaUrl}">

        </video>

    </div>

    `;

}





/* ==========================================
   RENDER POST FOOTER
========================================== */

function renderFooter(post) {

    return `

    <div class="postStats">

        <span class="viewsCount">
            👁 ${post.views || 0}
        </span>

        <span class="likesCount">
            ❤️ ${post.likes || 0}
        </span>

        <span class="commentsCount">
           💬  ${post.comments || 0}
        </span>

        <span class="sharesCount">
            🔁 ${post.shares || 0}
        </span>

    </div>

    <div class="postActions">

        <button
            class="likeBtn"
            data-id="${post.postId}">

            ❤️ Like

        </button>

        <button
            class="commentBtn"
            data-id="${post.postId}">

            💬 Comment

        </button>

        <button
            class="shareBtn"
            data-id="${post.postId}">

            🔁 Share

        </button>

        <button
            class="saveBtn"
            data-id="${post.postId}">

            🔖 Save

        </button>

        <button
            class="viewBtn"
            data-id="${post.postId}">

            👁 Open

        </button>

    </div>

    `;

}


/* ==========================================
   BUTTON EVENTS
========================================== */

document.addEventListener("click", async (e) => {

    /* ======================
       LIKE
    ====================== */

    if (e.target.classList.contains("likeBtn")) {

        const button = e.target;
        const postId = button.dataset.id;

        await toggleLike(postId);

        const liked = await checkIfLiked(postId);

        if (liked) {

            button.innerHTML = "❤️ Liked";
            button.classList.add("liked");

        } else {

            button.innerHTML = "❤️ Like";
            button.classList.remove("liked");

        }

        return;

    }


    /* ======================
       FOLLOW
    ====================== */

    if (e.target.classList.contains("followBtn")) {

        const button = e.target;
        const creatorUid = button.dataset.user;

        await toggleFollow(creatorUid);

        const following = await checkIfFollowing(creatorUid);

        if (following) {

            button.innerHTML = "Following";
            button.classList.add("following");

        } else {

            button.innerHTML = "Follow";
            button.classList.remove("following");

        }

        return;

    }


    /* ======================
       SAVE
    ====================== */

    if (e.target.classList.contains("saveBtn")) {

        const button = e.target;
        const postId = button.dataset.id;

        await toggleSave(postId);

        const saved = await checkIfSaved(postId);

        if (saved) {

            button.innerHTML = "📌 Saved";
            button.classList.add("saved");

        } else {

            button.innerHTML = "🔖 Save";
            button.classList.remove("saved");

        }

        return;

    }

});



/* ==========================================
   SHARE / COMMENT / VIEW
========================================== */

document.addEventListener("click", async (e) => {

    /* ======================
       SHARE
    ====================== */

    if (e.target.classList.contains("shareBtn")) {

        const postId = e.target.dataset.id;

        try {

            await sharePost(postId);

        } catch (err) {

            console.error("Share Error:", err);

        }

        return;

    }


    /* ======================
       COMMENT
    ====================== */

    if (e.target.classList.contains("commentBtn")) {

        const postId = e.target.dataset.id;

        location.href = `post.html?id=${postId}#comments`;

        return;

    }


    /* ======================
       OPEN POST + RECORD VIEW
    ====================== */

    if (e.target.classList.contains("viewBtn")) {

        const postId = e.target.dataset.id;

        try {

            await recordView(postId);

        } catch (err) {

            console.error("View Error:", err);

        }

        location.href = `post.html?id=${postId}`;

        return;

    }

});


/* ==========================================
   NOTIFICATION BADGE
========================================== */

function listenNotificationBadge() {

    const badge = document.getElementById("notificationBadge");

    if (!badge || !currentUser) return;

    const q = query(

        collection(db, "notifications"),

        where("receiverUid", "==", currentUser.uid)

    );

    onSnapshot(q, (snapshot) => {

        let unread = 0;

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            if (!data.isRead) {

                unread++;

            }

        });

        if (unread > 0) {

            badge.style.display = "flex";
            badge.textContent = unread;

        } else {

            badge.style.display = "none";
            badge.textContent = "0";

        }

    });

}






/* ==========================================
   SEARCH POSTS
========================================== */

if (searchInput) {

    searchInput.addEventListener("input", () => {

        const keyword = searchInput.value
            .trim()
            .toLowerCase();

        document.querySelectorAll(".postCard").forEach((card) => {

            const text = card.textContent.toLowerCase();

            card.style.display = text.includes(keyword)
                ? ""
                : "none";

        });

    });

}


/* ==========================================
   MOBILE NAVIGATION
========================================== */

const mobileRoutes = {

    "host-liveBtn": "host-live.html",

    "groupsBtn": "groups.html",

    "reelsBtn": "reels.html",

    "dashboardBtn": "dashboard.html",

    "settingsBtn": "settings.html"

};

Object.entries(mobileRoutes).forEach(([id, page]) => {

    const btn = document.getElementById(id);

    if (btn) {

        btn.addEventListener("click", () => {

            location.href = page;

        });

    }

});


/* ==========================================
   TIME AGO
========================================== */

function timeAgo(timestamp) {

    if (!timestamp) return "Just now";

    const date = timestamp.toDate();

    const seconds = Math.floor(
        (Date.now() - date.getTime()) / 1000
    );

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {

        return `${minutes}m ago`;

    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {

        return `${hours}h ago`;

    }

    const days = Math.floor(hours / 24);

    if (days < 30) {

        return `${days}d ago`;

    }

    const months = Math.floor(days / 30);

    if (months < 12) {

        return `${months}mo ago`;

    }

    const years = Math.floor(months / 12);

    return `${years}y ago`;

}


/* ==========================================
   HOME READY
========================================== */

console.log("✅ Home page loaded successfully.");





document.getElementById("createPostBox").addEventListener("click", () => {
    location.href = "upload.html";
});
