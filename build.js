const { writeFileSync, readFileSync } = require('fs');

const rollup = require('rollup');
const acorn = require('acorn');
const walk = require('acorn/dist/walk');
const MagicString = require('magic-string');
const VuePlugin = require('rollup-plugin-vue').default;
const userscriptCSS = require('rollup-plugin-userscript-css');
const metablock = require('rollup-plugin-userscript-metablock');
const cleanup = require('rollup-plugin-cleanup');

const pkg = require('./package.json');
const external = ['vue', 'vuex', 'vue-i18n'];
const globals = {
  vue: 'Vue',
  vuex: 'Vuex',
  'vue-i18n': 'VueI18n',
};

async function preBuild() {
  const bundle = await rollup.rollup({
    input: 'src/index.js',
    plugins: [
      VuePlugin()
    ],
    external,
  });

  const { code } = await bundle.generate({
    format: 'es',
    globals,
  });

  const codeAppendCSS = code + `import '../src/pixiv.override.css';`;

  writeFileSync('dist/index.js', codeAppendCSS);

  // Update metablock when dependencies have an upgrade version
  // Work when `npm run publish`
  const metablockJSON = require('./src/metablock.json');
  const metablockDevJSON = require('./src/metablock.dev.json');

  pkg.dependencies['FileSaver.js'] = pkg.dependencies['file-saver']; // special name

  Object.entries(pkg.dependencies).forEach(([depName, depVersion]) => {
    metablockJSON.require.forEach((cdn, idx, arr) => {
      const depRegex = new RegExp(`${depName}/[\\d.]+`);
      if (cdn.match(depRegex)) {
        arr[idx] = cdn.replace(depRegex, `${depName}/${depVersion.slice(1)}`);
      }
    });

    metablockDevJSON.require.forEach((cdn, idx, arr) => {
      const depRegex = new RegExp(`${depName}/[\\d.]+`);
      if (cdn.match(depRegex)) {
        arr[idx] = cdn.replace(depRegex, `${depName}/${depVersion.slice(1)}`);
      }
    });
  });

  writeFileSync('src/metablock.json', JSON.stringify(metablockJSON, null, 2));
  writeFileSync('src/metablock.dev.json', JSON.stringify(metablockDevJSON, null, 2));

  console.log('✔️ prepare build');
}

function removeDebuggers(code) {
  const ast = acorn.parse(code, {
    ecmaVersion: 9,
    ranges: true
  });
  const ms = new MagicString(code);

  walk.simple(ast, {
    CallExpression(node) {
      if (node.callee.object &&
        node.callee.object.name === '$print' &&
        node.callee.property.name === 'debug') {
        // $print.debug
        while (code[node.start - 1] === ' ') {
          node.start -= 1;
        }
        while (code[node.end] !== '\n') {
          node.end += 1;
        }
        node.end += 1; // remove '\n'
        ms.remove(node.start, node.end);
      }
    }
  });

  return ms.toString();
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

  const { code } = await bundle.generate({
    format: 'iife',
    globals,
  });

  const relCode = removeDebuggers(code);

  writeFileSync('dist/patchouli.user.js', relCode);

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

function updateReadme() {
  if ((/^\d+\.\d+\.\d+$/).test(pkg.version)) {
    ['README.md', 'README.en.md'].forEach(file => {
      const readme = readFileSync(file, 'utf8');
      const replaced = readme.replace(/latest-v[\d.]+/g, `latest-v${pkg.version}`);
      writeFileSync(file, replaced);

      const lines = replaced.split(/\r?\n/);
      const changelogIdx = lines.findIndex(line => line.includes('## Changelog'));
      let hasChangelog = false;
      for (const line of lines.slice(changelogIdx, -1)) {
        if (line.includes(pkg.version)) {
          hasChangelog = true;
          break;
        }
      }
      if (!hasChangelog) {
        console.warn('🛠 No changelog in current version.');
      }
    });
  }
}

// entry
preBuild().then(() => {
  buildRel();
  buildDev();
  updateReadme();
});
