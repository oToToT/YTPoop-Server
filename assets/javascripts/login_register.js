window.addEventListener('load', function() {
	let errors = document.querySelectorAll('.form .error');
	for (let error of errors) {
		error.addEventListener('click', function() {
			this.style.display = 'none';
		})
	}
	let tabs = document.getElementsByClassName('tabs');
	for (let i = 0; i < tabs.length; ++i) {
		let children = tabs[i].children;
		for (let child of children) {
			child.addEventListener('click', function() {
				let origin = document.querySelector('.tabs .active');
				let oid = origin.dataset.bind;
				document.getElementById(oid).classList.remove('active');
				origin.classList.remove('active');

				let tid = this.dataset.bind;
				document.getElementById(tid).classList.add('active');
				this.classList.add('active');

                history.pushState({}, '', this.dataset.page);
			})
		}
	}
})
