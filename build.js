const { writeFileSync, readFileSync } = require('fs');

const rollup = require('rollup');
const vue = require('rollup-plugin-vue');
const userscriptCSS = require('rollup-plugin-userscript-css');
const metablock = require('rollup-plugin-userscript-metablock');
const cleanup = require('rollup-plugin-cleanup');

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const external = ['vue', 'vuex', 'vue-i18n'];
const globals = {
  vue: 'Vue',
  vuex: 'Vuex',
  'vue-i18n': 'VueI18n'
};

async function preBuild() {
  const bundle = await rollup.rollup({
    input: 'src/index.js',
    plugins: [
      vue({
        compileTemplate: true,
        css(style) {
          writeFileSync('dist/index.css', style.replace(/\n{2,}/g, '\n').trim());
        }
      })
    ],
    external,
  });

  const { code } = await bundle.generate({
    format: 'es',
    globals,
  });

  const codeAppendCSS = code + `import './index.css';` + `import '../src/pixiv.override.css';`;

  writeFileSync('dist/index.js', codeAppendCSS);

  console.log('✔️ prepare build');
}

async function buildRel() {
  const bundle = await rollup.rollup({
    input: 'dist/index.js',
    plugins: [
      userscriptCSS(),
      cleanup(),
      metablock({
        file: 'src/metablock.json',
        version: pkg.version
      }),
    ],
    external,
  });

  await bundle.write({
    file: 'dist/patchouli.user.js',
    format: 'iife',
    globals,
  });

  console.log('✔️ build userscript for release');
}

async function buildDev() {
  const bundle = await rollup.rollup({
    input: 'dist/index.js',
    plugins: [
      userscriptCSS(),
      metablock({
        file: 'src/metablock.dev.json',
        version: pkg.version
      })
    ],
    external,
  });

  await bundle.write({
    file: 'dist/patchouli.dev.user.js',
    format: 'iife',
    globals,
  });

  console.log('✔️ build userscript for develop');
}

// entry
preBuild().then(() => {
  buildRel();
  buildDev();
});
