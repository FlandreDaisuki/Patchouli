Vue.component('koakuma-settings', {
	props: ['favorite', 'l10n'],
	methods: {
		fullwidthClick(event) {
			this.$emit('fullwidthUpdate', event.target.checked);
		},
		sortClick(event) {
			this.$emit('sortUpdate', event.target.checked);
		},
	},
	template: `
	<div>
		<input id="koakuma-settings-fullwidth" type="checkbox"
			:checked="favorite.fullwidth"
			@click="fullwidthClick"> {{ l10n.koakumaFullwidth }}
		<input id="koakuma-settings-sort" type="checkbox"
			:checked="favorite.sort"
			@click="sortClick"> {{ l10n.koakumaSort }}
	</div>`,
});
if (global.pageType !== 'not support') {
	utils.addStyle(`
	#wrapper.fullwidth,
	#wrapper.fullwidth .layout-a,
	#wrapper.fullwidth .layout-body {
		width: initial;
	}
	#wrapper.fullwidth .layout-a {
		display: flex;
		flex-direction: row-reverse;
	}
	#wrapper.fullwidth .layout-column-2{
		flex: 1;
		margin-left: 20px;
	}
	#wrapper.fullwidth .layout-body,
	#wrapper.fullwidth .layout-a {
		margin: 10px 20px;
	}`);
}

