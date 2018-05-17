<template>
  <div id="patchouli-context-menu" :style="inlineStyle">
    <ul id="patchouli-context-menu-list">
      <li>
        <a role="button" @click.left="thumbUp">
          <i data-feather="thumbs-up"/>
          {{ $t('contextMenu.thumbUp') }}
        </a>
      </li>
      <li>
        <a
          :href="bookmarkPageLink"
          role="button"
          target="_blank">
          <i data-feather="bookmark"/>
          {{ $t('contextMenu.openBookmarkPage') }}
        </a>
      </li>
    </ul>
  </div>
</template>


<script>
import { PixivAPI } from "../lib/pixiv";

export default {
  computed: {
    status() {
      return this.$store.state.contextMenu;
    },
    inlineStyle() {
      const RIGHT_BOUND = 200; // Magic Number ~
      const position = this.status.position;
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
      if (!this.status.data) {
        return "#";
      }
      const illustId = this.status.data.illustId;
      return `bookmark_add.php?type=illust&illust_id=${illustId}`;
    }
  },
  methods: {
    thumbUp() {
      const illustId = this.status.data.illustId;
      const found = this.$store.state.pixiv.imgLibrary.find(
        i => i.illustId === illustId
      );
      if (found) {
        PixivAPI.postThumbUp(found.illustId, found.userId);
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
#patchouli-context-menu-list > li {
  display: flex;
  align-items: center;
}
#patchouli-context-menu-list a {
  color: #85a;
  padding: 3px;
  flex: 1;
  border-radius: 5px;
  text-decoration: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
}
#patchouli-context-menu-list a:hover {
  background-color: #b28fce;
  color: #fff;
  cursor: pointer;
}
#patchouli-context-menu-list svg.feather {
  height: 18px;
  width: 18px;
  margin: 0 4px;
}
</style>
