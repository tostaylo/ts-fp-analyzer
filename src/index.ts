import * as open from 'open';
import { processFiles } from './extract';
import Fastify from 'fastify';
import * as fs from 'fs';

const fastify = Fastify({
	logger: true,
});
const myArgs = process.argv.slice(2);

const files: string[] = myArgs.filter((file) => file.endsWith('ts'));

processFiles(files);

(async function () {
	await open('http://localhost:3000');
})();

fastify.get('/', async (request, reply) => {
	const stream = fs.createReadStream('public/index.html');
	return reply.type('text/html').send(stream);
});

const start = async () => {
	try {
		await fastify.listen(3000);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();
