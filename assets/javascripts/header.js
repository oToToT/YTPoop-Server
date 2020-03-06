window.addEventListener('load', function() {
	document.getElementById('toggle-panel').addEventListener('click', function() {
		let panel = document.getElementById('panel');
		if (panel.style.display === 'none') {
			panel.style.display = '';
		} else {
			panel.style.display = 'none';
		}
	});
});
