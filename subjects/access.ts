export {};

let a = { b: 1 };
function one() {
	a.b;

	function two() {
		let a = { b: 1 };
		a.b;
	}
}
