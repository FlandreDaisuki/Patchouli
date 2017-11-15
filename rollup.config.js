// import strip from 'rollup-plugin-strip';
import metablock from 'rollup-plugin-userscript-metablock';
import userscriptCSS from 'rollup-plugin-userscript-css';
import json from 'rollup-plugin-json';
import cleanup from 'rollup-plugin-cleanup';

import vue from 'rollup-plugin-vue';
import {writeFileSync, readFileSync} from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

export default [
	{
		input: 'src/components/vue-components.js',
		output: {
			file: 'dist/vue-components.js',
			format: 'es'
		},
		plugins: [
			vue({
				css(style) {
					writeFileSync('dist/vue-components.css', style.replace(/\n{2,}/g, '\n').trim());
				}
			})
		]
	}, {
		input: 'src/main.js',
		output: {
			file: 'dist/patchouli.user.js',
			format: 'iife'
		},
		plugins: [
			json({
				preferConst: true
			}),
			userscriptCSS(),
			// strip({
			// 	debugger: true,
			// 	functions: ['$debug', '$expose'],
			// 	sourceMap: false
			// }),
			cleanup(),
			metablock({
				file: 'src/metablock.json',
				version: pkg.version
			})
		]
	}, {
		input: 'src/main.js',
		output: {
			file: 'dist/patchouli.dev.user.js',
			format: 'iife'
		},
		plugins: [
			json({
				preferConst: true
			}),
			userscriptCSS(),
			metablock({
				file: 'src/metablock.dev.json',
				version: pkg.version
			})
		]
	}
];
