import vue from 'rollup-plugin-vue';
import { writeFileSync } from 'fs';

export default [{
  input: 'index.js',
  output: {
    file: 'dist/index.js',
    format: 'iife'
  },
  external: ['vue', 'vuex'],
  plugins: [
    vue({
      css(style) {
        writeFileSync('dist/index.css', style.replace(/\n{2,}/g, '\n').trim());
      }
    })
  ],
  globals: {
    vue: 'Vue',
    vuex: 'Vuex'
  }
}];
