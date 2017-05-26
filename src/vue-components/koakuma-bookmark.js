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
			let val = parseInt(event.target.value);
			val = Math.max(0, val);
			this.$emit('limitUpdate', val);
		},
		wheel(event) {
			let val;
			if (event.deltaY < 0) {
				val = this.limit + 20;
			} else {
				val = Math.max(0, this.limit - 20);
			}
			this.$emit('limitUpdate', val);
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
