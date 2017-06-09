Vue.component('koakuma-bookmark', {
	props: ['limit', 'l10n'],
	methods: {
		blur(event) {
			const self = event.target;
			if (!self.validity.valid) {
				console.error('koakuma-bookmark', self.validationMessage);
			}
		},
		input(event) {
			let value = Math.max(0, parseInt(event.target.value));
			global.filters.limit = isNaN(value) ? 0 : value;
		},
		wheel(event) {
			let value;
			if (event.deltaY < 0) {
				value = this.limit + 20;
			} else {
				value = Math.max(0, this.limit - 20);
			}
			global.filters.limit = isNaN(value) ? 0 : value;
		},
	},
	template: `
	<div id="koakuma-bookmark">
		<label for="koakuma-bookmark-input">★{{ l10n.bookmark }}</label>
		<input id="koakuma-bookmark-input"
			type="number" min="0" step="1"
			:value="limit"
			@wheel.stop.prevent="wheel"
			@blur="blur"
			@input="input"/>
	</div>`,
});
