window.addEventListener('load', function() {
    let toggle = document.getElementById('toggle-panel');
    if (toggle) {
        toggle.addEventListener('click', function() {
            let panel = document.getElementById('panel');
            if (panel.style.display === 'none') {
                panel.style.display = '';
            } else {
                panel.style.display = 'none';
            }
        });
    }
});
