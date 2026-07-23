export function buildRedirectPage(post){

    return `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<title>${post.title} | CreatorHub</title>

<meta
name="description"
content="${post.description || post.title}">

<meta
property="og:title"
content="${post.title}">

<meta
property="og:description"
content="${post.description || post.title}">

<meta
property="og:image"
content="${post.mediaUrl || ""}">

<meta
property="og:url"
content="https://creatorhub.com/post/${post.postId}.html">

<meta
name="robots"
content="index,follow">

<link
rel="canonical"
href="https://creatorhub.com/post/${post.postId}.html">

<meta
http-equiv="refresh"
content="0;url=../post.html?id=${post.postId}">

<script>

window.location.replace(

"../post.html?id=${post.postId}"

);

</script>

</head>

<body>

<p>

Redirecting...

</p>

</body>

</html>`;

}


