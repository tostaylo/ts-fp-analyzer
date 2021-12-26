const { mermaidAPI } = mermaid;

(async function () {
	mermaidAPI.initialize({
		startOnLoad: true,
	});

	const insertGraphs = function (svgCode, bindFunctions) {
		const root = document.getElementById('root');
		root.innerHTML = svgCode;
		bindFunctions(root);
	};

	const data = await (await fetch('./graph-data.json')).json();

	let graphDefinition = 'graph TB \n';

	Object.entries(data).forEach(([key, value]) => {
		Object.entries(value.fnCalls).forEach(([fn, fnData]) => {
			graphDefinition += `${key}(<div id='${key}'>${key}</div>) --> ${fn}(<div id='${fn}'>${fn}</div>);\n`;
		});
	});

	mermaidAPI.render('mermaid', graphDefinition, insertGraphs);

	const details = document.getElementById('details');

	Object.entries(data).forEach(([key, value]) => {
		// try event delegation here?
		document.getElementById(key)?.addEventListener('click', () => {
			const html = Object.entries(value).map(([key, value]) => `<div>${key}: ${value}</div>`);

			details.innerHTML = html.join('');
		});
	});
})();
