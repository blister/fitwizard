let status = 'inactive';
let game_id = null;

document.getElementById('start_adventure').addEventListener('click', (ev) => {
	status = 'active';

	game_id = setInterval(game_tick, 5000);
});

document.getElementById('start_adventure').addEventListener('click', (ev) => {
	status = 'inactive';
	clearInterval(game_id);
});

let geoOptions = {
	enableHighAccuracy: true,
	timeout: 5000,
	maximumAge: 0
};

function game_tick() {
	navigator.geolocation.getCurrentPosition(store_tick, tick_error, geoOptions);
}

function tick_error() {
	document.getElementById('adventure_panel').innerHTML = 'Tick error';
}

function store_tick(pos) {
	let coords = pos.coords;

	let xhr = new XMLHttpRequest();
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.open('POST', '/adventure/1');
	xhr.onload = function() {
		document.getElementById('adventure_panel').innerHTML = '<pre>' + JSON.stringify(this.responseText) + '</pre>';
	}
	xhr.send(`lat=${coords.latitude}&lng=${coords.longitude}`);
}