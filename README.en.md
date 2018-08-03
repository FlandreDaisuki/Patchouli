<p align="center"><a href="https://github.com/FlandreDaisuki/Patchouli" target="_blank"><img width="50"src="https://i.imgur.com/VwoYc5w.png"></a></p>

[![latest-v4.1.10](https://img.shields.io/badge/latest-v4.1.10-blue.svg)](#)

[English](https://github.com/FlandreDaisuki/Patchouli/blob/master/README.en.md) - [中文](https://github.com/FlandreDaisuki/Patchouli/blob/master/README.md)

## Introduction

A simple pixiv crawler. Naming is inspired from **Touhou Project**.

## Installation

1. First, install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) for Chrome or [Tampermonkey](https://addons.mozilla.org/zh-TW/firefox/addon/tampermonkey/) for Firefox or [other userscript managers](https://greasyfork.org/help/installing-user-scripts) you like.
2. Then, click [**`here`**](https://rawgit.com/FlandreDaisuki/Patchouli/master/dist/patchouli.user.js)

## Functions

- Find pictures automatically
- The UI with i18n (en, ja, zh, zh-tw)
- Filter by **bookmarks count**<br>
  ![bookmark count filter](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/bookmark-count-filter.png)
- Filter by **tags with regexp**<br>
  ![tags filter](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/tags-filter.png)
   - example of tags or part of tags: `flandre`, `users入り`
   - example of regexp: `flandre|koishi`, `\d{3,}users入り`
- Sort by **bookmarks count or upload time**<br>
  ![sorting by](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/sorting-by.png)
- Use icon <img src="https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/fas-compress.svg" width="12"> <img src="https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/fas-expand.svg" width="12"> to switch width
- Use icon <img src="https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/fas-rss.svg" width="12"> to indicate following illustrator
- Right click extension
   - Click on image
      - Like
      - Download original size image (only support single image)
      - Preview  original size images
      - Open add bookmark page (Just click <img src="https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/bookmark-heart-off.svg" width="12"> if you want to add bookmark without adding tags)
   - Click on illustrator name
      - Follow
      - Blacklist (fake mute)

## Usage

[![demo video](https://img.youtube.com/vi/zIoCwdpZr0M/0.jpg)](https://www.youtube.com/watch?v=zIoCwdpZr0M)

## Contribution

Questions or suggestions, post [issue](https://github.com/FlandreDaisuki/Patchouli/issues) :coffee:

## Lisence

The MIT License (MIT)

Copyright (c) 2016-2018 FlandreDaisuki

## Changelog

2018-08-03 v4.1.10

- The heart icon that can one click bookmark supports one click unbookmark (#23, #25)

2018-07-04 v4.1.9

- Support Greasemonkey download with right click extension

2018-06-28 v4.1.8

- Support arrow keys (← and →) in showing original images

2018-06-25 v4.1.7

- Reduce packets in showing multiple original images

2018-06-25 v4.1.6

- Fix multiple not show original images (#21)

2018-06-18 v4.1.5

- Autoplay ugoira when mouse over (configurable)
   - **!CAUTION!** This feature uses network bandwith quite heavily.

2018-06-18 v4.1.4

- Right click extension previewing supports ugoira (small size and original size)

2018-06-16 v4.1.3

- Remove axios dependency

2018-06-14 v4.1.2

- Use pixiv [new API](https://github.com/FlandreDaisuki/Patchouli/wiki/New-API) (API from [pixiv's artwork page design](https://www.pixiv.net/info.php?id=4653))
   - This fix will reduce packet requests to speed up crawling

2018-06-03 v4.1.1

- Fix the UI stucks when bookmark threshold decreased too fast (e.g. 1k to 0)
   - This fix will slow the crawler speed a little

2018-06-01 v4.1.0

- Add right click extension
- Change icons

2018-05-17 v4.0.10

- Fix sorting by oldest wrong in search page (#17)

2018-05-12 v4.0.9

- Update theme color, style, animation
- Fix default bookmark count list can't disappear when click other place

2018-05-08 v4.0.8

- Fix pixiv trademark to "pixiv" (all lowercase)

2018-05-08 v4.0.7

- Add default bookmark count list for quick filtering (#16)

2018-04-25 v4.0.6

- Fix axios bug on Chrome (#15)

2018-03-17 v4.0.5

- Main button use mouseup event (Firefox sometimes can't work on click event)
- Add `en` name, description

2018-03-17 v4.0.4

- Fix duplicate illustId in v-for

2018-03-08 v4.0.3

- Enhence CSS style

2018-03-08 v4.0.2

- Fixed supported page type

2018-03-07 v4.0.1

- Fixed Korean i18n

2018-03-07 v4.0.0

- Use [Vuex](https://github.com/vuejs/vuex), [vue-i18n](https://github.com/kazupon/vue-i18n) plugins
- Follow the [Vue style guide](https://vuejs.org/v2/style-guide/)

2017-11-22 v3.0.4

(ignore before)
