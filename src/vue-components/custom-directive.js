Vue.directive('dataset', {
	bind: function(el, binding) {
		for (let key of Object.keys(binding.value)) {
			el.dataset[key] = binding.value[key];
		}
	}
});
