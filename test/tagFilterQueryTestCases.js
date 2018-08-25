// ref: src/store/pixiv.js use '\x00' as seperator
const tagStrList = [
  ['オリジナル', '女の子', '風景', '夕日', 'ショートボブ', 'セーラー服', 'オリジナル1000users入り'],
  ['水着', 'FGO', 'おっぱい', '葛飾北斎', '葛飾北斎(Fate)', 'Fate/GrandOrder', 'アビゲイル・ウィリアムズ(Fate)', 'Fate/GO1000users入り'],
  ['FGO', 'FateGO', 'フランケンシュタイン(Fate)', '魅惑の谷間', 'Fate/GrandOrder', '水着', 'Fate/GO1000users入り', '蒼空'],
  ['東方', 'フランドール・スカーレット', '東方Project', '東方Project500users入り'],
  ['touhou', 'フランドール・スカーレット', '東方', '東方Project', 'scarlet', 'Flandre', 'TouhouProject', 'female', 'CLIPSTUDIOPAINT'],
  ['東方', '東方Project', 'レミリア・スカーレット', 'フランドール・スカーレット', 'レミフラ', 'ほのぼの東方', 'スカーレット姉妹', 'キス', '東方Project1000users入り'],
  ['R-18', '東方project', '東方', 'フランドール・スカーレット', 'フランドール'],
  ['小傘', '早苗', '東方', '神奈子', '諏訪子', '唐傘「あれ?ヌシ様?」', '|-ﾟ)', 'ﾅｽﾞｪﾐﾃﾙﾝﾃﾞｨｽ!!', '東方Project100users入り', '東風谷早苗'],
  ['アリス', '島田愛里寿', 'ガールズ&パンツァー', 'ガルパン100users入り', 'ガルパン1000users入り'],
  ['R-18', 'ガールズ&パンツァー', '冷泉麻子', 'ガルパン'],
].map(tagList => tagList.join('\x00'));

export default [{
  answer: [1, 1, 1, 1, 0, 1, 0, 1, 1, 0].map(Boolean),
  problem: tagStrList,
  rule: 'users入り',
}, {
  answer: [1, 0, 0, 1, 1, 1, 1, 1, 1, 1].map(Boolean),
  problem: tagStrList,
  rule: '-fate',
}, {
  answer: [1, 0, 1, 1, 1, 1, 1, 1, 1, 1].map(Boolean),
  problem: tagStrList,
  rule: '-fate || フラン',
}, {
  answer: [0, 0, 0, 1, 1, 0, 1, 0, 0, 0].map(Boolean),
  problem: tagStrList,
  rule: '-レミ && スカーレット',
}, {
  answer: [0, 0, 0, 1, 1, 0, 1, 0, 0, 0].map(Boolean),
  problem: tagStrList,
  rule: '-レミ スカーレット',
}, {
  answer: [1, 0, 0, 1, 1, 0, 1, 0, 0, 0].map(Boolean),
  problem: tagStrList,
  rule: '{-レミ && スカーレット} || 風景',
}, {
  answer: [1, 0, 0, 1, 1, 0, 1, 0, 0, 0].map(Boolean),
  problem: tagStrList,
  rule: '-レミ && {スカーレット || 風景}',
}, {
  answer: [1, 0, 0, 1, 1, 0, 1, 0, 0, 0].map(Boolean),
  problem: tagStrList,
  rule: '-レミ {スカーレット || 風景}',
}, {
  answer: [1, 1, 1, 1, 1, 1, 0, 1, 1, 0].map(Boolean),
  problem: tagStrList,
  rule: '-R-18',
}, {
  answer: [0, 1, 1, 0, 0, 0, 0, 1, 0, 0].map(Boolean),
  problem: tagStrList,
  rule: 'fgo || |-ﾟ)',
}, {
  answer: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1].map(Boolean),
  problem: tagStrList,
  rule: 'ガールズ&パンツァー && R-18',
}];
