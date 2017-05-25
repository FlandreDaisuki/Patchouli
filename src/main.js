if (global.pageType !== 'not support') {
	utils.linkStyle('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css');
	koakuma.$mount(global.koakumaToMount);
	koakuma.start(1).then(() => {
		patchouli.$mount(global.patchouliToMount);
	});
}
Pixiv.rmAnnoyance();
