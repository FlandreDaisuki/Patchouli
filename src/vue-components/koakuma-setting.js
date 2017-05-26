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
