const html = `
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
		<script>
			mermaid.initialize({ startOnLoad: true });
		</script>
		<title>Call Graph</title>
	</head>
	<body>
		<div class="mermaid">
      graph TD 
        A --> B
     </div>
	</body>
</html>
`;
export default html;