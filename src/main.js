if (!global.pagetype.NOSUP) {
	utils.linkStyle('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css');
	koakuma.$mount(global.koakumaToMount);
	koakuma.start(1).then(() => {
		patchouli.$mount(global.patchouliToMount);
	});
}
Pixiv.rmAnnoyance();
if (global.pagetype.MYBOOKMARK) {
	// bind select-all and select-none event
	document.querySelectorAll('.select-none, .select-all').forEach(sel => {
		sel.addEventListener('click', e => {
			console.debug(e);
			for (let checkbox of [...document.querySelectorAll('input[name="book_id[]"]')]) {
				checkbox.checked = e.target.classList.contains('select-all');
			}
		});
	});
}
