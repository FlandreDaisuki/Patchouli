const { writeFileSync, readFileSync, readdirSync, unlinkSync } = require('fs');

const rollup = require('rollup');
const acorn = require('acorn');
const walk = require('acorn/dist/walk');
const MagicString = require('magic-string');
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

function removeDebuggers(code) {
  const ast = acorn.parse(code, { ecmaVersion: 9, ranges: true });
  const ms = new MagicString(code);

  walk.simple(ast, {
    FunctionDeclaration(node) {
      while (code[node.start - 1] === ' ') {
        node.start -= 1;
      }
      while (code[node.end] !== '\n') {
        node.end += 1;
      }
      node.end += 1; // remove '\n'
      if (node.id.name === '$debug') {
        ms.remove(node.start, node.end);
      }
    },
    CallExpression(node) {
      if (node.callee.name === '$debug') {
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

function cleanBuildDir() {
  const files = readdirSync('dist');
  for (const f of files) {
    if (f.endsWith('.js') || f.endsWith('.css')) {
      unlinkSync(`dist/${f}`);
    }
  }
}

// entry
cleanBuildDir();
preBuild().then(() => {
  buildRel();
  buildDev();
  updateReadme();
});
