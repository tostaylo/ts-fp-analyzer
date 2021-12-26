(async function () {
	const { mermaidAPI } = window.mermaid;

	const insertGraphs = initialize(mermaidAPI);

	const data = await (await fetch('/graph-data.json')).json();

	mermaidAPI.render('mermaid', createGraphDefinition(data), insertGraphs);

	renderMoreInfo(data);
})();

function createGraphDefinition(data) {
	let graphDefinition = 'graph TB \n';

	Object.entries(data).forEach(([key, value]) => {
		Object.entries(value.fnCalls).forEach(([fn, fnData]) => {
			graphDefinition += `${key}(<div id='${key}'>${key}</div>) --> ${fn}(<div id='${fn}'>${fn}</div>);\n`;
		});
	});
	return graphDefinition;
}

function renderMoreInfo(data) {
	const details = document.getElementById('details');

	Object.entries(data).forEach(([key, value]) => {
		// try event delegation here?
		document.getElementById(key)?.addEventListener('click', () => {
			const html = Object.entries(value).map(([key, value]) => {
				if (!value) return;

				if (Array.isArray(value)) {
					if (value.length === 0) return;

					return `<div> ${key}: ${value.map((item) => `<span>${item}</span>, `).join('')}</div>`;
				}

				if (typeof value === 'object') {
					if (Object.keys(value).length === 0) return;

					return `<div> ${key}: ${Object.entries(value)
						.map(
							([k, v]) =>
								`<div>----${k}:${Object.entries(v)
									.map(([l, x]) => `<div>--------${l}: ${x}</div>`)
									.join('')}</div>`
						)
						.join('')}</div>`;
				}

				return `<div>${key}: ${value}</div>`;
			});

			details.innerHTML = html.join('');
		});
	});
}

function initialize(mermaidAPI) {
	mermaidAPI.initialize({
		startOnLoad: true,
	});

	const insertGraphs = function (svgCode, bindFunctions) {
		const root = document.getElementById('root');
		root.innerHTML = svgCode;
		bindFunctions(root);
	};

	return insertGraphs;
}
