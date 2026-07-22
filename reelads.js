//==================================================
// REEL ADS ENGINE
// PART 1
//==================================================



//----------------------------------------------
// ADSTERRA ROTATION
//----------------------------------------------

const ADSTERRA_QUEUE=[

    "native",

    "300x250",

    "160x300"

];

let adsterraIndex=0;



//----------------------------------------------
// MANUAL ADS
//----------------------------------------------

const MANUAL_ADS=[

{

advertiser:"Midnight Pleasures",

profile:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHKkCQmdKXdvSJQAMh2qoknsxEeG8pBTFI8XiJgOIcIw&s=10",

image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHKkCQmdKXdvSJQAMh2qoknsxEeG8pBTFI8XiJgOIcIw&s=10",

description:"Experience comfort, quality, and confidence with our carefully curated range of adult wellness essentials",

button:"Learn More",

link:"https://omg10.com/4/10748984"

},

{

advertiser:"Secret Seduction",

profile:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQV-OS6wpR5CFgTaZJQlqlVGTGtFzy63-D_ZdUIFdbvpw&s=10",

image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQV-OS6wpR5CFgTaZJQlqlVGTGtFzy63-D_ZdUIFdbvpw&s=10",

description:"Rediscover intimacy with premium products designed to bring couples closer. Shop discreetly with fast delivery.",

button:"Learn More",

link:"https://omg10.com/4/7897686"

},

{

advertiser:"EarnGlobal",

profile:"https://thumbs.dreamstime.com/b/woman-hand-giving-money-2289846.jpg",

image:"https://thumbs.dreamstime.com/b/woman-hand-giving-money-2289846.jpg",

description:"Wanna know how to Start earning $2.5 per write up..!",

button:"Join Now",

link:"https://omg10.com/4/7897686"

},

{

advertiser:"Travel Deals",

profile:"https://i.ytimg.com/vi/Y-ywHtoo7vs/maxresdefault.jpg",

image:"https://i.ytimg.com/vi/Y-ywHtoo7vs/maxresdefault.jpg",

description:".",

button:"Learn More",

link:"https://omg10.com/4/7897686"

},

{

advertiser:"Tech World",

profile:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOeoCKDwLXx1hCclb1CtL-uzmi65Yfg5uaW6pk3CXjrA&s=10",

image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOeoCKDwLXx1hCclb1CtL-uzmi65Yfg5uaW6pk3CXjrA&s=10",

description:"Latest gadgets at unbeatable prices.",

button:"Learn More",

link:"https://omg10.com/4/7897686"

},

{

advertiser:"Fashion Hub",

profile:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1NhMGNP_grNSh89Jw-9c1ekdt22rYia_-FP5d4T15rQ&s=10",

image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1NhMGNP_grNSh89Jw-9c1ekdt22rYia_-FP5d4T15rQ&s=10",

description:"Upgrade your wardrobe today.",

button:"Learn More",

link:"https://omg10.com/4/7897686"

}

];

let manualIndex=0;



//----------------------------------------------
// ROTATION
//----------------------------------------------

const ROTATION=[

"adsterra",

"manual",

"manual"

];

let rotationIndex=0;




//==================================================
// REEL ADS ENGINE
// PART 2
// ROTATION HELPERS
//==================================================



//----------------------------------------------
// NEXT ADSTERRA
//----------------------------------------------

function nextAdsterra(){

    const type=ADSTERRA_QUEUE[adsterraIndex];

    adsterraIndex++;

    if(adsterraIndex>=ADSTERRA_QUEUE.length){

        adsterraIndex=0;

    }

    return type;

}



//----------------------------------------------
// NEXT MANUAL
//----------------------------------------------

function nextManual(){

    const ad=MANUAL_ADS[manualIndex];

    manualIndex++;

    if(manualIndex>=MANUAL_ADS.length){

        manualIndex=0;

    }

    return ad;

}



//----------------------------------------------
// NEXT ROTATION
//----------------------------------------------

function nextRotation(){

    const type=ROTATION[rotationIndex];

    rotationIndex++;

    if(rotationIndex>=ROTATION.length){

        rotationIndex=0;

    }

    return type;

}



//----------------------------------------------
// RESET ENGINE
//----------------------------------------------

export function resetReelAds(){

    adsterraIndex=0;

    manualIndex=0;

    rotationIndex=0;

}



//==================================================
// REEL ADS ENGINE
// PART 3
// BUILD ADSTERRA CARDS
//==================================================



//----------------------------------------------
// COMMON WRAPPER
//----------------------------------------------

function createAdWrapper(){

    const wrapper=document.createElement("section");

    wrapper.className="reelCard sponsoredReel";

    wrapper.innerHTML=`

        <div class="reelSponsoredHeader">

            <span>Sponsored</span>

        </div>

        <div class="reelSponsoredBody"></div>

    `;

    return wrapper;

}



//----------------------------------------------
// NATIVE
//----------------------------------------------

function buildNativeAd(){

    const wrapper=createAdWrapper();

    const body=wrapper.querySelector(".reelSponsoredBody");

    const container=document.createElement("div");

    container.id="container-"+crypto.randomUUID();

    body.appendChild(container);

    setTimeout(()=>{

        container.id="container-1d99478d06f0c78b684ba8b345f25fc5";

        const script=document.createElement("script");

        script.async=true;

        script.setAttribute(

            "data-cfasync",

            "false"

        );

        script.src="https://bluntutilities.com/1d99478d06f0c78b684ba8b345f25fc5/invoke.js";

        body.appendChild(script);

    },100);

    return wrapper;

}



//----------------------------------------------
// 300x250
//----------------------------------------------

function build300x250(){

    const wrapper=createAdWrapper();

    const body=wrapper.querySelector(".reelSponsoredBody");

    setTimeout(()=>{

        window.atOptions={

            key:"0be1e382fd37fb22ea434d15f4bb3687",

            format:"iframe",

            width:300,

            height:250,

            params:{}

        };

        const script=document.createElement("script");

        script.src="https://bluntutilities.com/0be1e382fd37fb22ea434d15f4bb3687/invoke.js";

        script.async=true;

        body.appendChild(script);

    },100);

    return wrapper;

}



//----------------------------------------------
// 160x300
//----------------------------------------------

function build160x300(){

    const wrapper=createAdWrapper();

    const body=wrapper.querySelector(".reelSponsoredBody");

    setTimeout(()=>{

        window.atOptions={

            key:"7155b480d19b066c1cf49de50bbfa94e",

            format:"iframe",

            width:160,

            height:300,

            params:{}

        };

        const script=document.createElement("script");

        script.src="https://bluntutilities.com/7155b480d19b066c1cf49de50bbfa94e/invoke.js";

        script.async=true;

        body.appendChild(script);

    },100);

    return wrapper;

}



  //==================================================
// REEL ADS ENGINE
// PART 4
// MANUAL ADS
//==================================================



//----------------------------------------------
// BUILD MANUAL AD
//----------------------------------------------

function buildManualAd(){

    const ad=nextManual();

    const wrapper=document.createElement("section");

    wrapper.className="reelCard sponsoredReel";

    wrapper.innerHTML=`

        <div class="manualAdHeader">

            <img

                src="${ad.profile}"

                class="manualAdAvatar">

            <div>

                <h4>${ad.advertiser}</h4>

                <small>Sponsored</small>

            </div>

        </div>

        <a

            href="${ad.link}"

            target="_blank"

            class="manualAdImageLink">

            <img

                src="${ad.image}"

                class="manualAdImage">

        </a>



        <div class="manualAdBody">

            <p>${ad.description}</p>

            <a

                href="${ad.link}"

                target="_blank"

                class="manualLearnBtn">

                ${ad.button}

            </a>

        </div>

    `;

    return wrapper;

}



//----------------------------------------------
// NEXT ADSTERRA CARD
//----------------------------------------------

function requestAdsterra(){

    const type=nextAdsterra();

    switch(type){

        case "native":

            return buildNativeAd();

        case "300x250":

            return build300x250();

        case "160x300":

            return build160x300();

        default:

            return buildNativeAd();

    }

}



//----------------------------------------------
// NEXT AD
//----------------------------------------------

function requestNextAd(){

    const type=nextRotation();

    if(type==="adsterra"){

        return requestAdsterra();

    }

    return buildManualAd();

}





//==================================================
// REEL ADS ENGINE
// PART 5
// FINAL
//==================================================



//----------------------------------------------
// SHOULD INSERT
//----------------------------------------------

function shouldInsertAd(index){

    //------------------------------------------
    // After Reel 1
    //------------------------------------------

    if(index===0){

        return true;

    }

    //------------------------------------------
    // After every 3 reels
    //------------------------------------------

    return (

        (index+1)%3===0

    );

}



//----------------------------------------------
// INSERT AD
//----------------------------------------------

export function insertReelAd(

    container,

    reelIndex

){

    if(

        !shouldInsertAd(reelIndex)

    ){

        return;

    }

    container.appendChild(

        requestNextAd()

    );

}



//----------------------------------------------
// APPEND REEL
//----------------------------------------------

export function appendReelWithAds(

    container,

    reelElement,

    reelIndex

){

    //------------------------------------------
    // Add reel
    //------------------------------------------

    container.appendChild(

        reelElement

    );



    //------------------------------------------
    // Add ad
    //------------------------------------------

    insertReelAd(

        container,

        reelIndex

    );

}




