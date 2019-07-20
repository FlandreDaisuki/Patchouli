<p align="center"><a href="https://github.com/FlandreDaisuki/Patchouli" target="_blank"><img width="50"src="https://i.imgur.com/VwoYc5w.png"></a></p>

[![latest-v4.2.3](https://img.shields.io/badge/latest-v4.2.3-blue.svg)](#)

[English](https://github.com/FlandreDaisuki/Patchouli/blob/master/README.en.md) - [中文](https://github.com/FlandreDaisuki/Patchouli/blob/master/README.md)

- [Introduction](#Introduction)
- [Installation](#Installation)
  - [Compatibility Table](#Compatibility-Table)
- [Functions](#Functions)
  - [Demo Video](#Demo-Video)
    - [Basic Funtions](#Basic-Funtions)
    - [v4.2.0 Added functions](#v420-Added-functions)
  - [Control Panel](#Control-Panel)
  - [Image items](#Image-items)
  - [Preview Mode](#Preview-Mode)
- [Contribution](#Contribution)
- [Lisence and Credits](#Lisence-and-Credits)
- [Changelog](#Changelog)

## Introduction

A simple pixiv crawler. Naming is inspired from **Touhou Project**.

Pixiv deploys their [new profile page](https://www.pixiv.net/info.php?id=4704). We'll release v4.2.0 to make compatiable to that after they are done completely.

If you are already in new profile page, you can [download the alpha version here](https://github.com/FlandreDaisuki/Patchouli/raw/4.2.x/dist/patchouli.user.js).

## Installation

1. First, install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) for Chrome or [Tampermonkey](https://addons.mozilla.org/zh-TW/firefox/addon/tampermonkey/) for Firefox or [other userscript managers](https://greasyfork.org/help/installing-user-scripts) you like.
2. Then, click [**`here`**](https://rawgit.com/FlandreDaisuki/Patchouli/master/dist/patchouli.user.js)

### Compatibility Table

|×|![tampermonkey](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/tm32.png)|![violentmonkey](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/vm32.png)|![greasemonkey](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/gm32.png)|
|:--:|:--:|:--:|:--:|
|![Firefox](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/fx32.png)|✔️|✔️|🔺|
|![Google Chrome](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/gc32.png)|✔️|✔️| N/A |

🔺 Not support Greasemonkey ugoira autoplay ([#22](https://github.com/FlandreDaisuki/Patchouli/issues/22))

## Functions

### Demo Video

#### Basic Funtions
[![demo video](https://img.youtube.com/vi/zIoCwdpZr0M/0.jpg)](https://www.youtube.com/watch?v=zIoCwdpZr0M)

#### v4.2.0 Added functions
[![v4.2.0 demo video](https://img.youtube.com/vi/TM9na7UGSPw/0.jpg)](https://www.youtube.com/watch?v=TM9na7UGSPw)

### Control Panel

![koakuma](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/koakuma-en.png)

- Press <kbd> Go </kbd>, find all. (No need pagination any more)
- The UI with i18n (en, ja, zh-cn, zh-tw) **Welcome translation PR**
- Filter by **bookmarks count**
- Filter by **Tag Filter Query**<br>
   - Basic examples: `flandre`, `users入り`, `-R-18`
   - Logical operator examples: `flandre || koishi`, `touhou && R-18`
   - complicated examples: `touhou && {flandre || alice}`
   - More details in [wiki](https://github.com/FlandreDaisuki/Patchouli/wiki/Tag-Filter-Query-Usage)
- Sort by **bookmarks count** or **upload time** or **bookmark added time**
- Use icon ![fas-compress](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/fas-compress.png) ![fas-expand](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/fas-expand.png) to switch width
- Use icon ![unbookmarked-only-on](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/unbookmarked-only-on.png) ![unbookmarked-only-off](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/unbookmarked-only-off.png) to switch that shows unbookmarked only
- Settings:
   - Switch right click extension
   - Switch illustrator tooltip (the popup when mouse over illustrator name)
   - Switch ugoira autoplay
   - Blacklist

### Image items
- Use icon ![fas-rss-dodgerblue](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/fas-rss-dodgerblue.png) to indicate following illustrator
- Use icon ![bookmark-heart-on](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/bookmark-heart-on.png) ![bookmark-heart-private](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/bookmark-heart-private.png) ![bookmark-heart-off](https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/assets/bookmark-heart-off.png) to indicate bookmarked (public/private) or not, click icon can add or remove bookmark directly

![imageitem](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/imageitem.png)

Autoplay ugoira when mouse over ⚠️ This feature uses network bandwith quite heavily ⚠️

![ugoira](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/ugoira.gif)

Right click extension
- Click on image
   - Like
   - Download original size image (only support single image)
   - Preview images in preview mode
   - Open add bookmark (with tags) page
- Click on illustrator name
   - Follow
   - Blacklist (simulate mute function)


### Preview Mode

Support single, multiple, and ugoira illustration, and manipulate with mouse click and wheel scroll.

![preview mode](https://rawgit.com/FlandreDaisuki/Patchouli/master/assets/preview-mode.png)

## Contribution

- Please tell me if you found bugs: [Bug report](https://github.com/FlandreDaisuki/Patchouli/issues/new?template=Bug_report.md) 🐛🐛
- Also, welcome feature request: [Feature request](https://github.com/FlandreDaisuki/Patchouli/issues/new?template=Feature_request.md) 💡💡
- And also welcome source contribution: [pull request](https://github.com/FlandreDaisuki/Patchouli/pulls) ⌨️⌨️
- Share and give me a ⭐️ to encourage me to maintain this project, and thanks [contributors](https://github.com/FlandreDaisuki/Patchouli/graphs/contributors) 👍👍

## Lisence and Credits

The MIT License (MIT)

Copyright (c) 2016-2019 FlandreDaisuki

Font Awesome Free

[Icons — CC BY 4.0 License](https://fontawesome.com/license/free)

## Changelog

2019-07-20 v4.2.3

- Update depenencies
- Do not hide iframe

2019-01-10 v4.2.2

- Update depenencies
- pixiv CSS class updated

2018-10-11 v4.2.1

- [RawGit will end](https://rawgit.com/), move dependencies back to GitCDN

2018-10-3 v4.2.0

- Refactoring code
- Support [new profile page](https://www.pixiv.net/info.php?id=4704)
- Support mouse wheel in showing original images
- Change tag filter from **RegExp** to **Tag Filter Query**
- Adjust styles

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
