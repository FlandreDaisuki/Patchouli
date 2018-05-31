<p align="center"><a href="https://github.com/FlandreDaisuki/Patchouli" target="_blank"><img width="50"src="https://i.imgur.com/VwoYc5w.png"></a></p>

[![latest-v4.1.0](https://img.shields.io/badge/latest-v4.1.0-blue.svg)](#)

[English](./README.en.md) - [中文](./README.md)

## Introduction 簡介

一個簡單暴力的 pixiv 搜尋引擎。命名以兩位**東方Project**角色為主。

## Installation 安裝

1. 安裝 Chrome 的 [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) 或 Firefox 的 [Tampermonkey](https://addons.mozilla.org/zh-TW/firefox/addon/tampermonkey/) 或[其他你喜歡的腳本管理器](https://greasyfork.org/help/installing-user-scripts)
2. 安裝完成後按 [**`這裡`**](https://rawgit.com/FlandreDaisuki/Patchouli/master/dist/patchouli.user.js)

## Functions 功能

- 自動找圖
- 部份 i18n 界面 (en, ja, zh, zh-tw)
- 以 **收藏數** 過濾結果<br>
  ![bookmark count filter](assets/bookmark-count-filter.png)
- 以 **人氣／日期** 排序結果<br>
  ![sorting by](assets/sorting-by.png)
- 以圖示 <img src="assets/fas-compress.svg" width="12"> <img src="assets/fas-expand.svg" width="12"> 切換寬度
- 以圖示 <img src="assets/fas-rss.svg" width="12"> 標注已關注繪師
- 擴充右鍵功能
  - 圖片上右鍵
    - 點讚
    - 原圖下載 (只支援單張圖片)
    - 預覽原圖 (支援單張、多張；不支援動圖)
    - 開啟加入書籤頁 (可加標籤，若無此需求可使用 <img src="assets/bookmark-heart-off.svg" width="12"> 快速添加)
  - 繪師名稱上右鍵
    - 加關注
    - 加黑單 (類似高級會員靜音功能)

## Usage 使用說明

[![demo video](https://img.youtube.com/vi/zIoCwdpZr0M/0.jpg)](https://www.youtube.com/watch?v=zIoCwdpZr0M)

## Contribution 貢獻

有問題或建議發 [issue](https://github.com/FlandreDaisuki/Patchouli/issues) :coffee:

## Lisence 授權

The MIT License (MIT)

Copyright (c) 2016-2018 FlandreDaisuki

## Changelog 更新訊息

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
