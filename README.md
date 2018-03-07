<p align="center"><a href="https://github.com/FlandreDaisuki/Patchouli" target="_blank"><img width="50"src="https://i.imgur.com/VwoYc5w.png"></a></p>

[![latest-v4.0.0](https://img.shields.io/badge/latest-v4.0.0-blue.svg)](#)

[English](./README.en.md) - [中文](./README.md)

## Introduction 簡介

一個簡單暴力的 Pixiv 搜尋引擎。命名以兩位**東方Project**角色為主。

## Installation 安裝

1. 安裝 Chrome 的 [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) 或 Firefox 的 [Tampermonkey](https://addons.mozilla.org/zh-TW/firefox/addon/tampermonkey/) 或[其他你喜歡的腳本管理器](https://greasyfork.org/help/installing-user-scripts)
2. 安裝完成後按 [**`這裡`**](https://rawgit.com/FlandreDaisuki/Patchouli/master/dist/patchouli.user.js)

## Functions 功能

- 自動找圖
- 以 (收藏數／標籤) 過濾結果
- 以 (投稿時間／收藏數) 排序結果
- 切換 (自適應螢幕／預設) 寬度
- 部份 i18n 界面 (en, ja, zh, zh-tw)
- 以圖示 <img src="https://cdnjs.cloudflare.com/ajax/libs/simple-icons/3.0.1/rss.svg" width="12"> 標注 (已關注／未關注) 畫師

## Usage 使用說明

<p align="center">
  <a href="https://www.youtube.com/watch?v=E1yWWO9e--k" target="_blank">
    <img src="https://img.youtube.com/vi/E1yWWO9e--k/0.jpg" alt="示範影片"/>
  </a>
</p>

- 按`找`或`停`來開關搜尋
- 滑鼠移動到收藏數可用滾輪增減收藏數，或直接打數字
- 標籤過濾器可以過濾圖片標籤，支援 regexp (ex. `レミ|フラン`)

## Contribution 貢獻

有問題或建議發 [issue](https://github.com/FlandreDaisuki/Patchouli/issues) :coffee:

## Lisence 授權

The MIT License (MIT)

Copyright (c) 2016-2018 FlandreDaisuki

## Changelog 更新訊息

2018-03-07 v4.0.0

- 使用 [Vuex](https://github.com/vuejs/vuex), [vue-i18n](https://github.com/kazupon/vue-i18n)
- 遵循 [Vue style guide](https://vuejs.org/v2/style-guide/)

2017-11-22 v3.0.4

(前略)
