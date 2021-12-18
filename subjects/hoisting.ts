export {};
function one() {}

one();
two();

function two() {
	one();

	function one() {}
}
