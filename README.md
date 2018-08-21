<p align="center"><a href="https://github.com/FlandreDaisuki/Patchouli" target="_blank"><img width="50"src="https://i.imgur.com/VwoYc5w.png"></a></p>

[![latest-v4.2.0](https://img.shields.io/badge/latest-v4.2.0-blue.svg)](#)

[English](https://github.com/FlandreDaisuki/Patchouli/blob/master/README.en.md) - [中文](https://github.com/FlandreDaisuki/Patchouli/blob/master/README.md)

## Introduction 簡介

一個簡單暴力的 pixiv 搜尋引擎。命名以兩位**東方Project**角色為主。

## Installation 安裝

1. 安裝 Chrome 的 [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) 或 Firefox 的 [Tampermonkey](https://addons.mozilla.org/zh-TW/firefox/addon/tampermonkey/) 或[其他你喜歡的腳本管理器](https://greasyfork.org/help/installing-user-scripts)
2. 安裝完成後按 [**`這裡`**](https://rawgit.com/FlandreDaisuki/Patchouli/master/dist/patchouli.user.js)

## Functions 功能

- 自動找圖
- 部份 i18n 界面 (en, ja, zh-cn, zh-tw)
- 以 **收藏數** 過濾結果<br>
  ![bookmark count filter](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/bookmark-count-filter.png)
- 以 **標籤正規表達式** 過濾結果<br>
  ![tags filter](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/tags-filter.png)
   - 完整／部份標籤範例： `芙蘭朵露`, `users入り`
   - 正規表達式範例： `芙蘭朵露|古明地戀`, `\d{3,}users入り`
- 以 **人氣／日期** 排序結果<br>
  ![sorting by](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/sorting-by.png)
- 以圖示 <img src="https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/fas-compress.svg" width="12"> <img src="https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/fas-expand.svg" width="12"> 切換寬度
- 以圖示 <img src="https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/fas-rss.svg" width="12"> 標注已關注繪師
- 擴充右鍵功能
   - 圖片上右鍵
      - 點讚
      - 原圖下載 (只支援單張圖片)
      - 預覽原圖 (支援單張、多張、動圖，並可用鍵盤方向鍵、滑鼠滾輪操作)
      - 開啟加入書籤頁 (可加標籤，若無此需求可使用 <img src="https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/bookmark-heart-off.svg" width="12"> 快速添加)
   - 繪師名稱上右鍵
      - 加關注
      - 加黑單 (類似高級會員靜音功能)
- 可自動播放動圖 ⚠️ 請斟酌自己的電腦效能及頻寬 ⚠️

## Usage 使用說明

[![demo video](https://img.youtube.com/vi/zIoCwdpZr0M/0.jpg)](https://www.youtube.com/watch?v=zIoCwdpZr0M)

## Contribution 貢獻

- 找到問題請告訴我：[問題回報](https://github.com/FlandreDaisuki/Patchouli/issues/new?template=Bug_report.md) 🐛🐛
- 有任何建議也歡迎告訴我：[許願池](https://github.com/FlandreDaisuki/Patchouli/issues/new?template=Feature_request.md) 💡💡
- 或是歡迎直接貢獻原始碼：[pull request](https://github.com/FlandreDaisuki/Patchouli/pulls) ⌨️⌨️
- 分享並點個 ⭐️ 讓我有動力繼續無償維護下去，並感謝曾經給予幫助的[貢獻者們](https://github.com/FlandreDaisuki/Patchouli/graphs/contributors) 👍👍

## Lisence 授權

The MIT License (MIT)

Copyright (c) 2016-2018 FlandreDaisuki

## Changelog 更新訊息

2018-99-99 v4.2.0

- 內部程式碼重構
- 支援新版作者頁
- 原圖預覽支援滾輪翻頁
- 部份樣式調整

2018-08-03 v4.1.10

- 愛心圖示的一鍵收藏再點一下可直接刪除收藏 (#23, #25)

2018-07-04 v4.1.9

- 支援 Greasemonkey 右鍵擴充下載原圖

2018-06-28 v4.1.8

- 在顯示原圖支援方向鍵 (← 和 →)

2018-06-25 v4.1.7

- 多圖顯示原圖減少封包請求

2018-06-25 v4.1.6

- 修正多圖顯示原圖錯誤 (#21)

2018-06-18 v4.1.5

- 滑鼠移到動圖自動播放 (可關閉)
   - **!注意!** 自動播放非常吃網路頻寬，請自行斟酌

2018-06-18 v4.1.4

- 擴充右鍵可預覽動圖 (縮小尺寸、原尺寸)

2018-06-16 v4.1.3

- 移除 axios 依賴庫

2018-06-14 v4.1.2

- 使用 pixiv [新的 API](https://github.com/FlandreDaisuki/Patchouli/wiki/New-API) (從[作品版面新設計](https://www.pixiv.net/info.php?id=4653)的 API 借來用)
   - 此修正大幅減少封包請求，增加抓圖速度

2018-06-03 v4.1.1

- 修正收藏數門檻驟降導致 UI 卡死 (從1千到0)
   - 此修正會降低一點點抓圖速度

2018-06-01 v4.1.0

- 新增擴充右鍵功能
- 變更圖示

2018-05-17 v4.0.10

- 修正按舊排序時沒有正確排序 (#17)

2018-05-12 v4.0.9

- 變更主題配色，樣式，動畫
- 修正點開預設書籤數後點頁面其他地方不會收回

2018-05-08 v4.0.8

- 修正 pixiv 的商標為 pixiv (全小寫)

2018-05-08 v4.0.7

- 新增預設書籤數按鈕加速過濾 (#16)

2018-04-25 v4.0.6

- 修正 axios 在 Chrome 上的 bug (#15)

2018-03-17 v4.0.5

- 主按鈕改成觸發 mouseup 事件 (Firefox 有時 click 事件會收不到)
- 增加 `en` name, description

2018-03-17 v4.0.4

- 修正 v-for 有 duplicate illustId 導致卡住

2018-03-08 v4.0.3

- 改善 CSS 樣式

2018-03-08 v4.0.2

- 修正支援頁面類型

2018-03-07 v4.0.1

- 修正韓文 i18n

2018-03-07 v4.0.0

- 使用 [Vuex](https://github.com/vuejs/vuex), [vue-i18n](https://github.com/kazupon/vue-i18n)
- 遵循 [Vue style guide](https://vuejs.org/v2/style-guide/)

2017-11-22 v3.0.4

(前略)
