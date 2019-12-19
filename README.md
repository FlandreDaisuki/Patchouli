<p align="center"><a href="https://github.com/FlandreDaisuki/Patchouli" target="_blank"><img width="50"src="https://i.imgur.com/VwoYc5w.png"></a></p>

[![latest-v4.2.7](https://img.shields.io/badge/latest-v4.2.7-blue.svg)](#)

[English](https://github.com/FlandreDaisuki/Patchouli/blob/master/README.en.md) - [中文](https://github.com/FlandreDaisuki/Patchouli/blob/master/README.md)

- [簡介](#簡介)
- [安裝](#安裝)
  - [瀏覽器腳本管理器相容表](#瀏覽器腳本管理器相容表)
- [功能](#功能)
  - [範例影片](#範例影片)
    - [基本功能介紹](#基本功能介紹)
    - [v4.2.0 新增功能介紹](#v420-新增功能介紹)
  - [主控欄](#主控欄)
  - [插圖簡介](#插圖簡介)
  - [預覽原圖](#預覽原圖)
- [貢獻](#貢獻)
- [授權條款與素材聲明](#授權條款與素材聲明)
- [更新訊息](#更新訊息)

## 簡介

一個簡單暴力的 pixiv 搜尋引擎。命名以兩位**東方Project**角色為主。

## 安裝

1. 安裝 Chrome 的 [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) 或 Firefox 的 [Tampermonkey](https://addons.mozilla.org/zh-TW/firefox/addon/tampermonkey/) 或[其他你喜歡的腳本管理器](https://greasyfork.org/help/installing-user-scripts)
2. 安裝完成後按 [**`這裡`**](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/dist/patchouli.user.js)

### 瀏覽器腳本管理器相容表

|×|![tampermonkey](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/tm32.png)|![violentmonkey](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/vm32.png)|![greasemonkey](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/gm32.png)|
|:--:|:--:|:--:|:--:|
|![Firefox](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/fx32.png)|✔️|✔️|🔺|
|![Google Chrome](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/gc32.png)|✔️|✔️| N/A |

🔺 目前不支援 Greasemonkey 動圖自動播放功能 ([#22](https://github.com/FlandreDaisuki/Patchouli/issues/22))

## 功能

### 範例影片

#### 基本功能介紹
[![demo video](https://img.youtube.com/vi/zIoCwdpZr0M/0.jpg)](https://www.youtube.com/watch?v=zIoCwdpZr0M)

#### v4.2.0 新增功能介紹
[![v4.2.0 demo video](https://img.youtube.com/vi/TM9na7UGSPw/0.jpg)](https://www.youtube.com/watch?v=TM9na7UGSPw)

### 主控欄

![koakuma](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/koakuma.png)

- 自動找圖，再也不需要*頁數*
- 界面有部份 i18n (en, ja, zh-cn, zh-tw) **歡迎翻譯 PR**
- 以 **收藏數** 過濾結果
- 以 **標籤過濾查詢式** 過濾結果
   - 基本範例： `芙蘭朵露`, `users入り`, `-R-18`
   - 邏輯運算子範例： `芙蘭朵露 || 古明地戀`, `東方 && R-18`
   - 複雜範例：`東方 && {フラン || アリス}`
   - 詳細請見 [wiki](https://github.com/FlandreDaisuki/Patchouli/wiki/Tag-Filter-Query-Usage)
- 以 **人氣／日期／加入書籤日期** 排序結果
- 以圖示 ![fas-compress](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/fas-compress.png) ![fas-expand](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/fas-expand.png) 切換寬度
- 以圖示 ![unbookmarked-only-on](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/unbookmarked-only-on.png) ![unbookmarked-only-off](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/unbookmarked-only-off.png) 切換是否只顯示未收藏
- 設定：
   - 開關擴充右鍵功能
   - 開關彈出畫師小資訊 (滑鼠游標移到畫師名字時跳出的那個)
   - 開關自動播放動圖功能
   - 黑名單

### 插圖簡介

- 以圖示 ![fas-rss-dodgerblue](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/fas-rss-dodgerblue.png) 標注已關注繪師
- 以圖示 ![bookmark-heart-on](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/bookmark-heart-on.png) ![bookmark-heart-private](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/bookmark-heart-private.png) ![bookmark-heart-off](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/bookmark-heart-off.png) 表示已收藏(公開/非公開)/未收藏，點擊則可直接添加收藏及取消收藏

![imageitem](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/imageitem.png)

可自動播放動圖 ⚠️ 請斟酌自己的電腦效能及頻寬 ⚠️

![ugoira](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/ugoira.gif)

擴充右鍵功能

- 圖片上右鍵
   - 點讚
   - 原圖下載 (只支援單張圖片)
   - 預覽原圖
   - 開啟加入書籤頁
- 繪師名稱上右鍵
   - 加關注
   - 加黑單 (類似高級會員靜音功能)

### 預覽原圖

支援單張、多張、動圖，並可用鍵盤方向鍵、滑鼠滾輪操作

![preview mode](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/preview-mode.png)

## 貢獻

- 找到問題請告訴我：[問題回報](https://github.com/FlandreDaisuki/Patchouli/issues/new?template=Bug_report.md) 🐛🐛
- 有任何建議也歡迎告訴我：[許願池](https://github.com/FlandreDaisuki/Patchouli/issues/new?template=Feature_request.md) 💡💡
- 或是歡迎直接貢獻原始碼：[pull request](https://github.com/FlandreDaisuki/Patchouli/pulls) ⌨️⌨️
- 分享並點個 ⭐️ 讓我有動力繼續無償維護下去，並感謝曾經給予幫助的[貢獻者們](https://github.com/FlandreDaisuki/Patchouli/graphs/contributors) 👍👍

## 授權條款與素材聲明

The MIT License (MIT)

Copyright (c) 2016-2019 FlandreDaisuki

Font Awesome Free

[Icons — CC BY 4.0 License](https://fontawesome.com/license/free)

## 更新訊息

2019-12-19 v4.2.7

- 修掉舊書籤頁圖片顯示 (#53)

2019-12-16 v4.2.6

- 修掉 CSRF token 取得方法 (#52)

2019-11-10 v4.2.5

- 修掉找不到 id 就 throw 的 bug (#50)

2019-09-14 v4.2.4

- 增加 切方縮圖/原圖縮圖 選項按鈕

2019-07-20 v4.2.3

- 更新依賴
- 不隱藏 iframe

2019-01-10 v4.2.2

- 更新依賴
- pixiv CSS class 更新

2018-10-11 v4.2.1

- [RawGit 要關了](https://rawgit.com/)，改用 GitCDN

2018-10-3 v4.2.0

- 內部程式碼重構
- 支援[新版作者頁](https://www.pixiv.net/info.php?id=4704)
- 原圖預覽支援滾輪翻頁
- 將標籤過濾器的語言規則從**標籤正規表達式**改成**標籤過濾查詢式**
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
