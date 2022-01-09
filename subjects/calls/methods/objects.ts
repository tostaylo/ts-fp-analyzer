export {};

let a = {};
function one() {
	Object.assign(a, {});
}

function two() {
	const b = {};
	const c = {};
	Object.assign(b, c);
}
