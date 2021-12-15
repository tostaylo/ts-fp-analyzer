import { processFiles } from './extract';

const myArgs = process.argv.slice(2);

const files: string[] = myArgs.filter((file) => file.endsWith('ts'));

processFiles(files);
