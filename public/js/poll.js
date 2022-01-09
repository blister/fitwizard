
setInterval(function() {

	let xhr = new XMLHttpRequest();
	xhr.open('GET', '/vibration');
	xhr.onload = function() {
		let json = JSON.parse(this.responseText);
		console.log(json);
		if ( json.buzz ) {
			navigator.vibrate([100, 100, 300]);
			document.getElementById('vibrate').innerHTML = 'vibrate';
		} else {
			document.getElementById('vibrate').innerHTML = 'novibrate';
		}
	};
	xhr.send();

}, 5000);

document.getElementById('buzz').addEventListener('click', function() {
	document.body.style.backgroundColor = 'blue';
	navigator.vibrate(300);
	setTimeout(function() {
		document.body.style.backgroundColor = 'mediumseagreen';
	},400);
});