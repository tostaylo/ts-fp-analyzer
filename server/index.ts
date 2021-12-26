import * as open from 'open';
import { processFiles } from '../src/extract';
import * as express from 'express';
import * as fs from 'fs';
import html from './html';

const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/graph/:file', (req, res) => {
	const data = processFiles([`subjects/${req.params.file}.ts`]);
	const json = JSON.stringify(Object.fromEntries(data));

	fs.writeFileSync('public/graph-data.json', json);
	res.send(html());
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});

// (async function () {
// 	await open('http://localhost:3000');
// })();
