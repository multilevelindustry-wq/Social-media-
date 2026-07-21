//==========================================
// REPLY.JS
//==========================

import {

    db,

    auth

} from "./firebase.js";



import{

collection,

addDoc,

query,

where,

orderBy,

limit,

getDocs,

getDoc,

doc,

serverTimestamp,

updateDoc,

deleteDoc,

increment

}from 
"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";




//==========================================
// TIME AGO
//==========================================

function timeAgo(timestamp){

    if(!timestamp) return "Just now";

    const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if(seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if(minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if(hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if(days < 7) return `${days}d ago`;

    const weeks = Math.floor(days / 7);
    if(weeks < 5) return `${weeks}w ago`;

    const months = Math.floor(days / 30);
    if(months < 12) return `${months}mo ago`;

    const years = Math.floor(days / 365);
    return `${years}y ago`;

}



//==========================================
// ACTIVE REPLY
//==========================================

let activeReplyBox=null;


//==========================================
// OPEN REPLY BOX
//==========================================

window.openReplyBox=function(

commentId,

parentReplyId=null

){

    if(activeReplyBox){

        activeReplyBox.remove();

    }

    const id=parentReplyId||commentId;

    const container=document.getElementById(

        `replyContainer-${id}`

    );

    if(!container)return;

    container.innerHTML=`

    <div class="replyBox">

        <textarea

        id="replyInput-${id}"

        placeholder="Write a reply...">

        </textarea>

        <div class="replyBtns">

            <button

            onclick="closeReplyBox()">

            Cancel

            </button>

            <button

            onclick="submitReply(

            '${commentId}',

            ${parentReplyId?`'${parentReplyId}'`:`null`}

            )">

            Reply

            </button>

        </div>

    </div>

    `;

    activeReplyBox=container.firstElementChild;

};


//==========================================
// CLOSE BOX
//==========================================

window.closeReplyBox=function(){

    if(activeReplyBox){

        activeReplyBox.remove();

        activeReplyBox=null;

    }

};


//==========================================
// SUBMIT REPLY
//==========================================

window.submitReply=async function(

commentId,

parentReplyId=null

){

    const id=parentReplyId||commentId;

    const input=document.getElementById(

        `replyInput-${id}`

    );

    if(!input)return;

    const text=input.value.trim();

    if(!text)return;

    try{

        const snap=await getDoc(

            doc(

                db,

                "users",

                auth.currentUser.uid

            )

        );

        if(!snap.exists())return;

        const user=snap.data();

        await addDoc(

            collection(

                db,

                "replies"

            ),

            {

                commentId,

                parentReplyId,

                uid:auth.currentUser.uid,

                username:user.username,

                photo:user.photo,

                reply:text,

                likes:0,

                likedBy:[],

                edited:false,

                createdAt:serverTimestamp()

            }

        );

        closeReplyBox();

        loadReplies(commentId);

    }

    catch(err){

        console.error(err);

    }

};


//==========================================
// LOAD ROOT REPLIES
//==========================================

window.loadReplies = async function(commentId){

    const container = document.getElementById(

        `replies-${commentId}`

    );

    if(!container) return;

    container.innerHTML="";

    try{

        const q=query(

            collection(

                db,

                "replies"

            ),

            where(

                "commentId",

                "==",

                commentId

            ),

            where(

                "parentReplyId",

                "==",

                null

            ),

            orderBy(

                "createdAt",

                "asc"

            ),

            limit(30)

        );

        const snapshot=await getDocs(q);

        if(snapshot.empty){

            return;

        }

        for(const docSnap of snapshot.docs){

            const reply={

                replyId:docSnap.id,

                ...docSnap.data()

            };

            renderReply(

                reply,

                container

            );

        }

    }

    catch(err){

        console.error(

            "Replies:",

            err

        );

    }

};


//==========================================
// RENDER REPLY
//==========================================

function renderReply(

    reply,

    container

){

    const div=document.createElement("div");

    div.className="replyCard";

    div.innerHTML=`

        <img

        src="${reply.photo}"

        class="replyAvatar">

        <div class="replyContent">

            <h5>

                ${reply.username}

            </h5>

            <p>

                ${reply.reply}

                ${reply.edited?

                `<span class="editedTag">

                    (edited)

                </span>`

                :""}

            </p>

            <div class="replyTime">

                ${timeAgo(reply.createdAt)}

            </div>
            
            <div class="replyActions">

<button

onclick="openReplyBox(

'${reply.commentId}',

'${reply.replyId}'

)">

Reply

</button>

<button

id="toggle-${reply.replyId}"

onclick="toggleReplies(

'${reply.replyId}'

)">

▶ View Replies

</button>

<button

onclick="likeReply(

'${reply.replyId}'

)">

❤️ ${reply.likes||0}

</button>

${reply.uid===auth.currentUser.uid?`

<button

onclick="editReply(

'${reply.replyId}',

\`${reply.reply}\`,

'${reply.commentId}'

)">

✏ Edit

</button>

<button

onclick="deleteReply(

'${reply.replyId}',

'${reply.commentId}'

)">

🗑 Delete

</button>

`:``}

</div>

            <div

            id="replyContainer-${reply.replyId}">

            </div>

            <div

            id="children-${reply.replyId}"

            class="replyChildren">

            </div>

        </div>

    `;

    container.appendChild(div);

}


//==========================================
// TOGGLE REPLIES
//==========================================

window.toggleReplies = async function(parentReplyId){

    const container = document.getElementById(

        `children-${parentReplyId}`

    );

    const button = document.getElementById(

        `toggle-${parentReplyId}`

    );

    if(!container || !button) return;

    //----------------------------------
    // HIDE
    //----------------------------------

    if(container.dataset.loaded==="true"){

        if(container.style.display==="none"){

            container.style.display="block";

            button.innerHTML="▼ Hide Replies";

        }else{

            container.style.display="none";

            button.innerHTML="▶ View Replies";

        }

        return;

    }

    //----------------------------------
    // FIRST LOAD
    //----------------------------------

    container.innerHTML=`

        <div class="loadingReplies">

            Loading replies...

        </div>

    `;

    container.style.display="block";

    button.innerHTML="▼ Hide Replies";

    try{

        const q=query(

            collection(db,"replies"),

            where(

                "parentReplyId",

                "==",

                parentReplyId

            ),

            orderBy(

                "createdAt",

                "asc"

            ),

            limit(30)

        );

        const snapshot=await getDocs(q);

        container.innerHTML="";

        if(snapshot.empty){

            container.innerHTML=`

                <div class="noReplies">

                    No replies yet.

                </div>

            `;

            container.dataset.loaded="true";

            return;

        }

        for(const docSnap of snapshot.docs){

            const reply={

                replyId:docSnap.id,

                ...docSnap.data()

            };

            renderReply(

                reply,

                container

            );

        }

        container.dataset.loaded="true";

    }

    catch(err){

        console.error(err);

    }

};



//==========================================
// LIKE / UNLIKE REPLY
//==========================================

window.likeReply = async function(replyId){

    try{

        const replyRef = doc(

            db,

            "replies",

            replyId

        );

        const snap = await getDoc(replyRef);

        if(!snap.exists()) return;

        const reply = snap.data();

        let likedBy = reply.likedBy || [];

        //----------------------------------
        // UNLIKE
        //----------------------------------

        if(likedBy.includes(auth.currentUser.uid)){

            likedBy = likedBy.filter(

                uid => uid !== auth.currentUser.uid

            );

            await updateDoc(

                replyRef,

                {

                    likes: increment(-1),

                    likedBy

                }

            );

        }

        //----------------------------------
        // LIKE
        //----------------------------------

        else{

            likedBy.push(auth.currentUser.uid);

            await updateDoc(

                replyRef,

                {

                    likes: increment(1),

                    likedBy

                }

            );

        }

        //----------------------------------
        // REFRESH
        //----------------------------------

        loadReplies(reply.commentId);

    }

    catch(err){

        console.error(err);

    }

};



//==========================================
// EDIT REPLY
//==========================================

window.editReply = async function(

    replyId,

    oldText,

    commentId

){

    const text = prompt(

        "Edit Reply",

        oldText

    );

    if(text===null) return;

    if(!text.trim()) return;

    try{

        await updateDoc(

            doc(

                db,

                "replies",

                replyId

            ),

            {

                reply:text.trim(),

                edited:true,

                editedAt:serverTimestamp()

            }

        );

        loadReplies(commentId);

    }

    catch(err){

        console.error(err);

    }

};



//==========================================
// DELETE REPLY
//==========================================

window.deleteReply = async function(

    replyId,

    commentId

){

    if(

        !confirm(

            "Delete this reply?"

        )

    ){

        return;

    }

    try{

        await deleteDoc(

            doc(

                db,

                "replies",

                replyId

            )

        );

        loadReplies(commentId);

    }

    catch(err){

        console.error(err);

    }

};




//==========================================
// REPLY COUNT
//==========================================

window.getReplyCount = async function(commentId){

    const q=query(

        collection(db,"replies"),

        where("commentId","==",commentId)

    );

    const snap=await getDocs(q);

    return snap.size;

};


