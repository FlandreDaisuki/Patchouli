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
        <a
          :href="bookmarkPageLink"
          role="button"
          target="_blank">
          <i class="far fa-bookmark"/>
          {{ $t('contextMenu.openBookmarkPage') }}
        </a>
      </li>
    </ul>
    <ul v-show="currentType === 'image-item-title'" id="patchouli-context-menu-list-image-item-title" >
      <li>
        <a role="button" @click.left="addToBlacklist">
          <i class="far fa-eye-slash"/>
          {{ $t('contextMenu.addToBlacklist') }}
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
    currentType() {
      if (!this.xm.data) {
        return "";
      }
      return this.xm.data.type;
    },
    currentImageItem() {
      if (!this.xm.data) {
        return null;
      }
      const illustId = this.xm.data.illustId;
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
      if (!this.xm.data) {
        return "#";
      }
      const illustId = this.xm.data.illustId;
      return `bookmark_add.php?type=illust&illust_id=${illustId}`;
    },
    isDownloadable() {
      return (
        this.currentImageItem &&
        this.currentImageItem.illustPageCount === 1 &&
        !this.currentImageItem.isUgoira // unsupport ugoira currently
      );
    }
  },
  methods: {
    thumbUp() {
      if (this.currentImageItem) {
        PixivAPI.postThumbUp(
          this.currentImageItem.illustId,
          this.currentImageItem.userId
        );
      }
    },
    async downloadOne() {
      const imgUrl = this.currentImageItem.url.big;
      const illustId = this.currentImageItem.illustId;
      const a = $el("a", { href: imgUrl });

      const filename = a.pathname.split("/").pop();
      const ext = filename
        .split(".")
        .pop()
        .toLowerCase();

      const response = await GMC.xmlhttpRequest({
        method: "GET",
        url: imgUrl,
        // greasemonkey maybe no this API
        responseType: "arraybuffer",
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
