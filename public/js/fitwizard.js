let status = 'inactive';

document.getElementById('start_adventure').addEventListener('submit', (e) => {
	e.preventDefault();
	navigator.geolocation.getCurrentPosition(success, error, options);
});