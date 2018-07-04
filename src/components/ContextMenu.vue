<template>
  <div id="patchouli-context-menu" :style="inlineStyle">
    <ul v-show="currentType === 'image-item-image'" id="patchouli-context-menu-list-image-item-image" >
      <li>
        <a role="button" @click.left="thumbUp">
          <i class="far fa-thumbs-up"/>
          {{ $t('contextMenu.thumbUp') }}
        </a>
      </li>
      <li v-show="isDownloadable">
        <a role="button" @click.left="downloadOne">
          <i class="fas fa-download"/>
          {{ $t('contextMenu.download') }}
        </a>
      </li>
      <li>
        <a role="button" @click.left="openPreview">
          <i class="fas fa-search-plus"/>
          {{ $t('contextMenu.preview') }}
        </a>
      </li>
      <li>
        <a
          :href="bookmarkPageLink"
          role="button"
          target="_blank">
          <i class="far fa-bookmark"/>
          {{ $t('contextMenu.openBookmarkPage') }}
        </a>
      </li>
    </ul>
    <ul v-show="currentType === 'image-item-title-user'" id="patchouli-context-menu-list-image-item-title-user" >
      <li>
        <a role="button" @click.left="addToBlacklist">
          <i class="far fa-eye-slash"/>
          {{ $t('contextMenu.addToBlacklist') }}
        </a>
      </li>
      <li v-show="currentImageItem && !currentImageItem.isFollowed">
        <a role="button" @click.left="followUser">
          <i class="fas fa-rss"/>
          {{ $t('contextMenu.followUser') }}
        </a>
      </li>
    </ul>
  </div>
</template>


<script>
import { PixivAPI } from "../lib/pixiv";
import { $el } from "../lib/utils";
import GMC from "../lib/gmc";

export default {
  computed: {
    // vue'x' state 'm'odule
    xm() {
      return this.$store.state.contextMenu;
    },
    xmd() {
      return this.xm.data;
    },
    currentType() {
      if (!this.xmd) {
        return "";
      }
      return this.xmd.type;
    },
    currentImageItem() {
      if (!this.xmd) {
        return null;
      }
      const illustId = this.xmd.illustId;
      const found = this.$store.state.pixiv.imgLibrary.find(
        i => i.illustId === illustId
      );
      return found ? found : null;
    },
    inlineStyle() {
      const RIGHT_BOUND = 200; // Magic Number ~
      const position = this.xm.position;
      const ow = document.body.offsetWidth;

      let style = `top: ${position.y}px;`;
      if (ow - position.x < RIGHT_BOUND) {
        style += `right: ${ow - position.x}px;`;
      } else {
        style += `left: ${position.x}px;`;
      }
      return style;
    },
    bookmarkPageLink() {
      if (!this.xmd) {
        return "#";
      }
      const illustId = this.xmd.illustId;
      return `bookmark_add.php?type=illust&illust_id=${illustId}`;
    },
    isDownloadable() {
      return (
        this.currentImageItem &&
        this.currentImageItem.illustPageCount === 1 &&
        !this.currentImageItem.isUgoira // unsupport ugoira currently
      );
    },
    isUgoira() {
      return this.currentImageItem && this.currentImageItem.isUgoira;
    }
  },
  methods: {
    thumbUp() {
      if (this.currentImageItem) {
        PixivAPI.postIllustLike(this.currentImageItem.illustId);
      }
    },
    async downloadOne() {
      const imgUrl = this.currentImageItem.urls.original;
      const illustId = this.currentImageItem.illustId;
      const a = $el("a", { href: imgUrl });

      const filename = a.pathname.split("/").pop();
      const ext = filename
        .split(".")
        .pop()
        .toLowerCase();

      const response = await GMC.XHR({
        method: "GET",
        url: imgUrl,
        // greasemonkey has no this API
        responseType: "arraybuffer",
        // for greasemonkey
        binary: true,
        headers: {
          Referer: `https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${illustId}`
        }
      });

      if (ext === "jpg" || ext === "jpeg") {
        saveAs(new File([response.response], filename, { type: "image/jpeg" }));
      } else if (ext === "png") {
        saveAs(new File([response.response], filename, { type: "image/png" }));
      }
    },
    addToBlacklist() {
      if (this.currentImageItem) {
        const userId = this.currentImageItem.userId;
        this.$store.state.config.blacklist.push(userId);
        this.$store.state.config.blacklist.sort((a, b) => a - b);
        this.$store.commit("saveConfig");
      }
    },
    openPreview() {
      this.$store.commit("openBigComponent", {
        mode: "preview",
        data: this.currentImageItem
      });
    },
    async followUser() {
      if (this.currentImageItem) {
        const userId = this.currentImageItem.userId;

        if (await PixivAPI.postFollowUser(userId)) {
          this.$store.commit("editImgItem", {
            type: "follow-user",
            userId: this.currentImageItem.userId
          });
        }
      }
    }
  }
};
</script>

<style scoped>
#patchouli-context-menu {
  box-sizing: border-box;
  border: 1px solid #b28fce;
  position: fixed;
  z-index: 10;
  background-color: #fff;
  font-size: 16px;
  overflow: hidden;
  border-radius: 6px;
}
#patchouli-context-menu > ul > li {
  display: flex;
  align-items: center;
}
#patchouli-context-menu > ul a {
  color: #85a;
  padding: 3px;
  flex: 1;
  border-radius: 5px;
  text-decoration: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  text-align: center;
}
#patchouli-context-menu > ul a:hover {
  background-color: #b28fce;
  color: #fff;
  cursor: pointer;
}
#patchouli-context-menu > ul i.far,
#patchouli-context-menu > ul i.fas {
  height: 18px;
  width: 18px;
  margin: 0 4px;
}
</style>
