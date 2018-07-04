<template>
  <div class="image-item-image">
    <a
      :href="illustPageUrl"
      class="image-flexbox"
      rel="noopener"
      @click.right="activateContextMenu"
      @mouseenter="controlUgoira"
      @mouseleave="controlUgoira">

      <div v-if="illustPageCount > 1" class="top-right-slot">
        <span><i class="far fa-images"/>
          {{ illustPageCount }}</span>
      </div>

      <img
        v-show="!ugoiraPlayed"
        :data-src="imgUrl"
        :src="imgUrl">
      <div
        v-if="isUgoira"
        v-show="!ugoiraPlayed"
        class="ugoira-icon"/>
      <canvas
        v-if="isUgoira"
        v-show="ugoiraPlayed"
        ref="smallUgoiraPreview"/>
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
import { PixivAPI } from '../lib/pixiv';

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
      selfIsBookmarked: this.isBookmarked,
      ugoiraPlayed: false,
      ugoiraPlayer: null,
      ugoiraMeta: null
    };
  },
  computed: {
    illustPageUrl() {
      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
    },
    canHoverPlay() {
      return this.$store.state.config.hoverPlay;
    }
  },
  mounted() {
    this.$nextTick(async() => {
      if (this.isUgoira && this.canHoverPlay) {
        this.ugoiraMeta = await PixivAPI.getIllustUgoiraMetaData(this.illustId);
      }
    });
  },
  methods: {
    oneClickBookmarkAdd() {
      if (!this.selfIsBookmarked) {
        this.selfIsBookmarked = true;
      }
    },
    activateContextMenu(event) {
      $print.debug("DefaultImageItemImage#activateContextMenu", event);
      if (this.$store.state.config.contextMenu) {
        event.preventDefault();
        const payload = {};

        payload.position = {
          x: event.clientX,
          y: event.clientY
        };

        payload.data = {
          illustId: this.illustId,
          type: "image-item-image"
        };

        this.$store.commit("activateContextMenu", payload);
      }
    },
    controlUgoira(event) {
      if (!this.ugoiraMeta) {
        return;
      }
      if (!this.ugoiraPlayer) {
        try {
          this.ugoiraPlayer = new ZipImagePlayer({
            canvas: this.$refs.smallUgoiraPreview,
            source: this.ugoiraMeta.src,
            metadata: this.ugoiraMeta,
            chunkSize: 300000,
            loop: true,
            autosize: true
          });
        } catch (error) {
          $print.error(error);
        }
      }
      if (this.canHoverPlay) {
        if (event.type === 'mouseenter') {
          this.ugoiraPlayed = true;
          this.ugoiraPlayer.play();
        } else {
          this.ugoiraPlayed = false;
          this.ugoiraPlayer.pause();
          this.ugoiraPlayer.rewind();
        }
      }
    }
  },
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
.image-flexbox:hover {
  text-decoration: none;
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
.ugoira-icon {
  position: absolute;
  flex: none;
  width: 40px;
  height: 40px;
  background: url(https://s.pximg.net/www/images/icon/playable-icon.svg) 50%
    no-repeat;
  top: 50%;
  left: 50%;
  margin: -20px 0 0 -20px;
}
img,
canvas {
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
  background: url(https://s.pximg.net/www/images/bookmark-heart-off.svg) center
    transparent;
  background-repeat: no-repeat;
  background-size: cover;
  opacity: 0.8;
  filter: alpha(opacity=80);
  transition: opacity 0.2s ease-in-out;
}
._one-click-bookmark.on {
  background-image: url(https://s.pximg.net/www/images/bookmark-heart-on.svg);
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
