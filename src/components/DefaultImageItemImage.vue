<template>
  <div class="image-item-image">
    <a
      :href="illustPageUrl"
      class="image-flexbox"
      rel="noopener"
      @click.right.prevent="activateContextMenu">

      <div v-if="illustPageCount > 1" class="top-right-slot">
        <span><span class="multiple-icon"/>
          {{ illustPageCount }}</span>
      </div>

      <img :data-src="imgUrl" :src="imgUrl">
      <div v-if="isUgoira" class="ugoira-icon"/>
    </a>
    <div
      :class="{on:selfIsBookmarked}"
      :data-click-label="illustId"
      :data-id="illustId"
      :title="selfIsBookmarked"
      class="_one-click-bookmark"
      data-type="illust"
      data-click-action="illust"
      @click.left="oneClickBookmarkAdd"/>
    <div v-if="bookmarkId" class="bookmark-input-container">
      <input
        :value="bookmarkId"
        type="checkbox"
        name="book_id[]">
    </div>
  </div>
</template>

<script>
import { $print } from "../lib/utils";

export default {
  props: {
    imgUrl: {
      type: String,
      default: ""
    },
    illustId: {
      type: String,
      default: ""
    },
    illustPageCount: {
      type: Number,
      default: 1
    },
    isUgoira: {
      type: Boolean,
      default: false
    },
    isBookmarked: {
      type: Boolean,
      default: false
    },
    bookmarkId: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      selfIsBookmarked: this.isBookmarked
    };
  },
  computed: {
    illustPageUrl() {
      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
    }
  },

  methods: {
    oneClickBookmarkAdd() {
      if (!this.selfIsBookmarked) {
        this.selfIsBookmarked = true;
      }
    },
    activateContextMenu(event) {
      $print.debug("DefaultImageItemImage#activateContextMenu", event);
      const payload = {};

      payload.position = {
        x: event.clientX,
        y: event.clientY
      };

      payload.data = {
        illustId: this.illustId
      };

      this.$store.commit("activateContextMenu", payload);
    }
  }
};
</script>

<style scoped>
.image-item-image {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.image-flexbox {
  display: flex;
  flex-flow: column;
  justify-content: center;
  align-items: center;
  z-index: 0;
  border: 1px solid rgba(0, 0, 0, 0.04);
  position: relative;
  height: 200px;
}
.top-right-slot {
  flex: none;
  display: flex;
  align-items: center;
  z-index: 1;
  box-sizing: border-box;
  margin: 0 0 -24px auto;
  padding: 6px;
  height: 24px;
  background: #000;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 0 0 0 4px;
  color: #fff;
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
}
.multiple-icon {
  display: inline-block;
  margin-right: 4px;
  width: 10px;
  height: 10px;
  background: url(https://source.pixiv.net/www/js/bundle/3b9b0b9e331e13c46aeadaea83132203.svg);
}
.ugoira-icon {
  position: absolute;
  flex: none;
  width: 40px;
  height: 40px;
  background: url(https://source.pixiv.net/www/js/bundle/f608d897f389e8161e230b817068526d.svg)
    50% no-repeat;
  top: 50%;
  left: 50%;
  margin: -20px 0 0 -20px;
}
img {
  max-height: 100%;
  max-width: 100%;
}
._one-click-bookmark {
  right: 0;
  width: 24px;
  height: 24px;
  line-height: 24px;
  z-index: 2;
  text-align: center;
  cursor: pointer;
  background: url(https://source.pixiv.net/www/images/bookmark-heart-off.svg)
    center transparent;
  background-repeat: no-repeat;
  background-size: cover;
  opacity: 0.8;
  filter: alpha(opacity=80);
  transition: opacity 0.2s ease-in-out;
}
._one-click-bookmark.on {
  background-image: url(https://source.pixiv.net/www/images/bookmark-heart-on.svg);
}
.bookmark-input-container {
  position: absolute;
  left: 0;
  top: 0;
  background: rgba(0, 0, 0, 0.4);
  padding: 6px;
  border-radius: 0 0 4px 0;
}
</style>
