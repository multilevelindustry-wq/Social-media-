import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const topProfile = document.getElementById("topProfile");
const createAvatar = document.getElementById("createAvatar");
const createBtn = document.getElementById("createBtn");
const notificationBtn = document.getElementById("notificationBtn");
const messageBtn = document.getElementById("messageBtn");
const searchInput = document.getElementById("searchInput");

let currentUser = null;
let currentUserData = null;

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.href = "login.html";
        return;
    }

    currentUser = user;

    await loadUserProfile();

    listenNotificationBadge();

});

async function loadUserProfile() {

    const snap = await getDoc(
        doc(db, "users", currentUser.uid)
    );

    if (!snap.exists()) return;

    currentUserData = snap.data();

    if (topProfile) {
        topProfile.src = currentUserData.photo || "assets/default-avatar.png";
    }

    if (createAvatar) {
        createAvatar.src = currentUserData.photo || "assets/default-avatar.png";
    }

}

if (createBtn) {

    createBtn.addEventListener("click", () => {

        location.href = "upload.html";

    });

}

if (notificationBtn) {

    notificationBtn.addEventListener("click", () => {

        location.href = "notifications.html";

    });

}

if (messageBtn) {

    messageBtn.addEventListener("click", () => {

        location.href = "messages.html";

    });

}

if (searchInput) {

    searchInput.addEventListener("keypress", (e) => {

        if (e.key === "Enter") {

            const q = searchInput.value.trim();

            if (q.length > 0) {

                location.href = `search.html?q=${encodeURIComponent(q)}`;

            }

        }

    });

}

document.querySelectorAll(".sidebar li").forEach(item => {

    item.addEventListener("click", () => {

        if (!currentUser) return;

        const text = item.textContent.trim();

        switch (text) {

            case "Home":
                location.href = "index.html";
                break;

            case "Profile":
                location.href = `profile.html?uid=${currentUser.uid}`;
                break;

            case "Dashboard":
                location.href = "dashboard.html";
                break;

            case "Groups":
                location.href = "groups.html";
                break;

            case "Live":
                location.href = "live.html";
                break;

            case "Messages":
                location.href = "messages.html";
                break;

            case "Saved":
                location.href = "saved.html";
                break;

            case "Settings":
                location.href = "settings.html";
                break;

        }

    });

});

if (topProfile) {

    topProfile.addEventListener("click", () => {

        if (!currentUser) return;

        location.href = `profile.html?uid=${currentUser.uid}`;

    });

}

window.logout = async function () {

    await signOut(auth);

    location.href = "login.html";

};

function listenNotificationBadge() {

    const badge = document.getElementById("notificationBadge");

    if (!badge || !currentUser) return;

    const q = query(
        collection(db, "notifications"),
        where("receiverUid", "==", currentUser.uid)
    );

    onSnapshot(q, (snapshot) => {

        let unread = 0;

        snapshot.forEach(doc => {

            const data = doc.data();

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
