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
      :title="selfIsBookmarked"
      class="_one-click-bookmark"
      @click.left.prevent.stop="oneClickBookmarkAdd"/>
    <div v-if="isSelfBookmarkPage" class="bookmark-input-container">
      <input
        :value="bookmarkId"
        type="checkbox"
        name="book_id[]">
    </div>
  </div>
</template>

<script>
import { $print } from '../lib/utils';
import { PixivAPI } from '../lib/pixiv';

export default {
  props: {
    bookmarkId: {
      default: '',
      type: String,
    },
    illustId: {
      default: '',
      type: String,
    },
    illustPageCount: {
      default: 1,
      type: Number,
    },
    imgUrl: {
      default: '',
      type: String,
    },
    isBookmarked: {
      default: false,
      type: Boolean,
    },
    isUgoira: {
      default: false,
      type: Boolean,
    },
  },
  // eslint-disable-next-line sort-keys
  data() {
    return {
      selfIsBookmarked: this.isBookmarked,
      ugoiraMeta: null,
      ugoiraPlayed: false,
      ugoiraPlayer: null,
    };
  },
  // eslint-disable-next-line sort-keys
  computed: {
    canHoverPlay() {
      return this.$store.getters.config.hoverPlay;
    },
    illustPageUrl() {
      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
    },
    isSelfBookmarkPage() {
      return this.$store.getters.isSelfBookmarkPage;
    },
  },
  mounted() {
    this.$nextTick(async() => {
      if (this.isUgoira && this.canHoverPlay) {
        this.ugoiraMeta = await PixivAPI.getIllustUgoiraMetaData(this.illustId);
      }
    });
  },
  // eslint-disable-next-line sort-keys
  methods: {
    activateContextMenu(event) {
      $print.debug('DefaultImageItemImage#activateContextMenu', event);
      if (this.$store.state.config.contextMenu) {
        event.preventDefault();

        const payload = {
          data: {
            illustId: this.illustId,
            type: 'image-item-image',
          },
          position: {
            x: event.clientX,
            y: event.clientY,
          },
        };

        this.$store.commit('contextMenu/activate', payload);
      }
    },
    controlUgoira(event) {
      if (!this.ugoiraMeta) {
        return;
      }
      if (!this.ugoiraPlayer) {
        try {
          this.ugoiraPlayer = new ZipImagePlayer({
            autosize: true,
            canvas: this.$refs.smallUgoiraPreview,
            chunkSize: 300000,
            loop: true,
            metadata: this.ugoiraMeta,
            source: this.ugoiraMeta.src,
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
    },
    async oneClickBookmarkAdd() {
      if (!this.selfIsBookmarked) {
        if (await PixivAPI.postRPCAddBookmark(this.illustId)) {
          this.selfIsBookmarked = true;
        }
      } else {
        // this.bookmarkId might be empty...
        // Because RPC API has no bookmarkId returned...
        let bookmarkId = this.bookmarkId;
        if (!bookmarkId) {
          const data = await PixivAPI.getIllustBookmarkData(this.illustId);
          bookmarkId = data.bookmarkData.id;
        }
        if (await PixivAPI.postRPCDeleteBookmark(bookmarkId)) {
          this.selfIsBookmarked = false;
        }
      }
    },
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
