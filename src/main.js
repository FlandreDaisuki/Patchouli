console.log('Vue.version:', Vue.version);
console.log('Patchouli version:', version);

if (globalStore.page.supported) {
	koakuma.$mount(globalStore.koakumaToMount);
	koakuma.start(1).then(() => {
		patchouli.$mount(globalStore.patchouliToMount);
	});
}
Pixiv.rmAnnoyance();
utils.linkStyle('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css');