import * as open from 'open';
import { processFiles } from './extract';
import * as express from 'express';
import html from './html';

const app = express();
const port = 3000;

app.use(express.static('public'));

const myArgs = process.argv.slice(2);

const files: string[] = myArgs.filter((file) => file.endsWith('ts'));

processFiles(files);

app.get('/', (req, res) => {
	res.send(html);
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});

// (async function () {
// 	await open('http://localhost:3000');
// })();
