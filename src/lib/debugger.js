function $debug(...args) {
	console.debug.apply(console, args);
}

function $expose(variables) {
	for (const [key, value] of Object.entries(variables)) {
		window[key] = value;
	}
}

export {
	$debug,
	$expose
};
