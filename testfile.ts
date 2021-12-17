function one() {}
one();

function two() {
	let arr = [1];
	arr.push(2);
	one();
	function one() {}
}
// a = 2;

// const arr1 = [1];
// arr1[0] = 2;
// arr1.push(3);
// let a = 'hi';
// let b = { bye: 'bye' };
// const c = function () {
// 	return null;
// };

// a = 'sup';
// c();
// b.bye = 'not bye';
