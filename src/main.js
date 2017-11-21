import Global from './lib/global'
import Pixiv from './lib/pixiv'
import {$log, $error} from './lib/utils'
import {$debug, $expose} from './lib/debugger'
import Crawler from './lib/crawler'
import {PageType} from './lib/pagetype'

import './pixiv.override.css'

import {Default, Koakuma} from '../dist/vue-components'
import '../dist/vue-components.css'

/* global Vue, axios */

const global = new Global()

$log(`[${Global.NAME}] version: ${Global.VERSION}`)

// just string compare
const storeVersion = global.store.get('version')
if (!storeVersion || Global.VERSION > storeVersion) {
  global.store.set(Object.assign({
    version: Global.VERSION
  }, global.conf))
} else {
  Object.assign(global.conf, global.store.get())
}
$debug('global:', global)
global.applyConf()

Pixiv.removeAnnoyings()

if (global.pagetype !== PageType.NO_SUPPORT) {
  const crawler = new Crawler(global)

  const patchouli = new Vue({
    components: {Default},
    data: {
      l10n: global.l10n,
      library: global.library,
      pagetype: global.pagetype,
      filters: global.filters
    },
    template: '<Default :l10n="l10n" :library="library" :pagetype="pagetype" :filters="filters" />'
  })

  const koakuma = new Vue({
    components: {Koakuma},
    data: {
      l10n: global.l10n,
      filters: global.filters,
      store: global.store,
      conf: global.conf,
      applyConf: global.applyConf.bind(global),
      crawler
    },
    template: '<Koakuma :l10n="l10n" :crawler="crawler" :filters="filters" :store="store" :conf="conf" :applyConf="applyConf"/>'
  })

  crawler.start({times: 1}).then(() => {
    patchouli.$mount(global.patchouliMountPoint)
    koakuma.$mount(global.koakumaMountPoint)
  }).catch(error => {
    $error(error)
  })

  $debug('crawler:', crawler)
  $expose({crawler, patchouli, koakuma})
}

$expose({global, Vue, axios})
