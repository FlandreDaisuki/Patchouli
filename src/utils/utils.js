const utils = {
	linkStyle(url) {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = url;
		document.head.appendChild(link);
	},
	linkScript(url) {
		const script = document.createElement('script');
		script.src = url;
		document.head.appendChild(script);
	},
	createIcon(name, options = {}) {
		const el = document.createElement('i');
		el.classList.add('fa');
		el.classList.add(`fa-${name}`);
		el.setAttribute('aria-hidden', 'true');
		return el;
	},
	addStyle(text, id = '') {
		const style = document.createElement('style');
		style.innerHTML = text;
		if (id) {
			style.id = id;
		}
		document.head.appendChild(style);
	},
};
