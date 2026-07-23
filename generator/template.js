export function buildPostHTML(post){

return `<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>${post.title}</title>

<meta name="description"

content="${post.description}">

<script>

location.replace(

"post.html?id=${post.postId}"

);

</script>

</head>

<body>

Redirecting...

</body>

</html>`;

}
