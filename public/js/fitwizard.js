let gameStatus = 'inactive';
let game_id = null;
let counter = 0;
let adventure_id = null;
let geoOptions = {
	enableHighAccuracy: true,
	timeout: 5000,
	maximumAge: 0
};

function game_tick() {
	counter++;
	console.log('game tick');
	navigator.geolocation.getCurrentPosition(store_tick, tick_error, geoOptions);
}

function tick_error() {
	document.getElementById('output_panel').innerHTML = 'Tick error';
}

function store_tick(pos) {
	let coords = pos.coords;

	let xhr = new XMLHttpRequest();
	xhr.open('POST', '/adventure/' + adventure_id);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
		let json = JSON.parse(this.responseText);
		if ( 'battle' in json ) {
			document.getElementById('battle_panel').innerHTML = JSON.stringify(json['battle']);
		}
		document.getElementById('output_panel').innerHTML = '<pre>' + this.responseText + '</pre>';
		console.log('prepping next', gameStatus);
		if ( gameStatus == 'active' ) {
			setTimeout(game_tick, 5000);
		}
	}
	xhr.send(`adventure=1&lat=${coords.latitude}&lng=${coords.longitude}&counter=${counter}`);
}

function start_adventure(pos) {
	let coords = pos.coords;

	let xhr = new XMLHttpRequest();
	xhr.open('POST', '/adventure');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
		document.getElementById('output_panel').innerHTML = 'Adventure started...';
		let json = JSON.parse(this.responseText);
		adventure_id = json.adventure_id;

		console.log('prepping next', gameStatus);
		if ( gameStatus == 'active' ) {
			setTimeout(game_tick, 5000);
		}
	}
	xhr.send(`lat=${coords.latitude}&lng=${coords.longitude}&counter=${counter}`);
}

document.getElementById('start_adventure').addEventListener('click', (ev) => {
	console.log('starting new game');
	gameStatus = 'active';
	navigator.geolocation.getCurrentPosition(start_adventure, tick_error, geoOptions);
	
});

document.getElementById('end_adventure').addEventListener('click', (ev) => {
	gameStatus = 'inactive';
	let xhr = new XMLHttpRequest();
	xhr.open('POST', '/adventure/' + adventure_id + '/end');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
		document.getElementById('output_panel').innerHTML = 'Adventure ended...';
		let json = JSON.parse(this.responseText);

		console.log('ending game', gameStatus);
	}
	xhr.send(`counter=${counter}`);
});


