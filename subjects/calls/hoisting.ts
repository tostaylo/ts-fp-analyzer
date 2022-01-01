export {};
function one() {}

one();
two();

function two() {
	three();

	function three() {}
}
