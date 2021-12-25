const { mermaidAPI } = mermaid;

(async function () {
	mermaidAPI.initialize({
		startOnLoad: false,
	});

	const root = document.getElementById('app');
	const insertGraphs = function (svgCode, bindFunctions) {
		root.innerHTML = svgCode;
	};

	const data = await (await fetch('./graph-data.json')).json();

	let graphDefinition = 'graph TB \n';

	Object.entries(data).forEach(([key, value]) => {
		Object.entries(value.fnCalls).forEach(([fn, fnData]) => {
			graphDefinition += `${key} --> ${fn}(<div id='${fn}'>${fn}</div>) \n`;
		});
	});

	mermaidAPI.render('mermaid', graphDefinition, insertGraphs);
})();
