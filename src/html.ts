const html = () => `
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="styles.css">
		<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>

		<title>Call Graph</title>
	</head>
	<body>
    <div id="root"></div>
    <div id="details"></div>
    <script src="index.js"></script>
	</body>
</html>
`;
export default html;
