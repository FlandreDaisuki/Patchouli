<template>
  <li class="illust-item-root">
    <a
      :href="illustPageUrl"
      class="illust-main"
      @click.right="activateContextMenu"
      @mouseenter="controlUgoira"
      @mouseleave="controlUgoira">
      <div class="illust-main-indicators">
        <IndicatorMultiple v-if="illustPageCount > 1" :illust-page-count="illustPageCount"/>
      </div>
      <div
        :style="illustMainImgStyle"
        class="illust-main-img">
        <IconUgoiraPlay v-if="isUgoira" v-show="!ugoiraPlayed"/>
        <canvas
          v-if="isUgoira"
          v-show="ugoiraPlayed"
          ref="smallUgoiraPreview"
          class="illust-main-ugoira"/>
      </div>
    </a>
    <div class="illust-buttons">
      <div>
        <button type="button" @click.left.prevent.stop="oneClickBookmarkAdd">
          <IconBookmarkHeart :actived="selfIsBookmarked"/>
        </button>
      </div>
    </div>
    <a
      :href="illustPageUrl"
      class="illust-title"
      @click.right="activateContextMenu">{{ illustTitle }}</a>
    <div v-show="showUserProfile" class="user-profile">
      <div>
        <a
          :href="illustPageUrl"
          :style="profileImgStyle"
          class="user-profile-img"/>
      </div>
      <a
        :href="userPageUrl"
        :class="navType === 3"
        class="user-profile-name"
        @click.right="activateContextMenu">{{ userName }}</a>
      <i v-if="isFollowed" class="fas fa-rss user-followed-indicator"/>
    </div>
    <div v-show="bookmarkCount > 0" class="illust-popularity">
      <span>{{ bookmarkCount }}</span>
    </div>
  </li>
</template>

<script>
import IconBookmarkHeart from './IconBookmarkHeart.vue';
import IconUgoiraPlay from './IconUgoiraPlay.vue';
import IndicatorMultiple from './IndicatorMultiple.vue';
import { $print } from '../lib/utils';
import { PixivAPI } from '../lib/pixiv';

export default {
  components: { IconBookmarkHeart, IconUgoiraPlay, IndicatorMultiple },
  props: {
    bookmarkCount: {
      default: 0,
      type: Number,
    },
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
    illustTitle: {
      default: '',
      type: String,
    },
    isBookmarked: {
      default: false,
      type: Boolean,
    },
    isFollowed: {
      default: false,
      type: Boolean,
    },
    isUgoira: {
      default: false,
      type: Boolean,
    },
    navType: {
      default: 0,
      type: Number,
    },
    profileImgUrl: {
      default: '',
      type: String,
    },
    showUserProfile: {
      default: true,
      type: Boolean,
    },
    thumbImgUrl: {
      default: '',
      type: String,
    },
    userId: {
      default: '',
      type: String,
    },
    userName: {
      default: '',
      type: String,
    },
  },
  // eslint-disable-next-line sort-keys
  data() {
    return {
      selfBookmarkId: this.bookmarkId,
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
    illustMainImgStyle() {
      return {
        backgroundImage: this.ugoiraPlayed ? 'none' : `url(${this.thumbImgUrl})`,
      };
    },
    illustPageUrl() {
      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
    },
    profileImgStyle() {
      return {
        backgroundImage: `url(${this.profileImgUrl})`,
      };
    },
    userPageUrl() {
      return `/member_illust.php?id=${this.userId}`;
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
      $print.debug('NewDefaultImageItem#activateContextMenu', event);
      if (this.$store.getters.config.contextMenu) {
        event.preventDefault();

        const payload = {
          position: {
            x: event.clientX,
            y: event.clientY,
          },
        };

        const ct = event.currentTarget;
        if (ct.classList.contains('user-profile-name')) {
          payload.data = {
            illustId: this.illustId,
            type: 'image-item-title-user',
          };
        } else {
          payload.data = {
            illustId: this.illustId,
            type: 'image-item-image',
          };
        }

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
        // this.selfBookmarkId might be empty...
        // Because RPC API has no bookmarkId returned...
        if (!this.selfBookmarkId) {
          const data = await PixivAPI.getIllustBookmarkData(this.illustId);
          this.selfBookmarkId = data.bookmarkData.id;
        }
        if (await PixivAPI.postRPCDeleteBookmark(this.selfBookmarkId)) {
          this.selfIsBookmarked = false;
        }
      }
    },
  },
};
</script>

<style scoped>
/*
@pixiv.override.css
:root {
  --new-default-image-item-square-size: 184px;
}
*/
.illust-item-root {
  margin: 0 12px 24px;
}
.illust-main {
  text-decoration: none;
}
.illust-main-indicators {
  display: flex;
  position: absolute;
  width: var(--new-default-image-item-square-size);
  justify-content: end;
}
.illust-main-img {
  align-items: center;
  background-color: #fff;
  background-position: 50%;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: 4px;
  display: flex;
  height: var(--new-default-image-item-square-size);
  justify-content: center;
  margin-bottom: 8px;
  position: relative;
  width: var(--new-default-image-item-square-size);
}
.illust-main-img::before {
  background-color: rgba(0, 0, 0, 0.02);
  content: "";
  display: block;
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
}
.illust-main-ugoira {
  object-fit: contain;
  height: var(--new-default-image-item-square-size);
  width: var(--new-default-image-item-square-size);
}
.illust-buttons {
  display: flex;
  height: 32px;
  justify-content: flex-end;
  margin-bottom: 8px;
  margin-top: -40px;
}
.illust-buttons > div {
  z-index: 1;
}
.illust-buttons > div > button {
  background: none;
  border: none;
  box-sizing: content-box;
  cursor: pointer;
  display: inline-block;
  height: 32px;
  line-height: 1;
  padding: 0;
}
.illust-title {
  color: #177082;
  display: block;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  margin: 0 0 4px;
  overflow: hidden;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: var(--new-default-image-item-square-size);
}
.user-profile {
  align-items: center;
  display: flex;
  width: var(--new-default-image-item-square-size);
  margin-bottom: 4px;
}
.user-profile > div {
  display: inline-block;
  margin-right: 4px;
}
.user-profile-img {
  background-size: cover;
  border-radius: 50%;
  display: block;
  flex: none;
  position: relative;
  overflow: hidden;
  width: 16px;
  height: 16px;
}
.user-profile-name {
  color: #999;
  font-size: 12px;
  line-height: 1;
  overflow: hidden;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.user-followed-indicator {
  display: inline-block;
  margin-left: 4px;
  width: 16px;
  height: 16px;
  color: dodgerblue;
}
.illust-popularity {
  display: flex;
  width: 100%;
  justify-content: center;
}
.illust-popularity > span {
  background-color: #cef;
  color: rgb(0, 105, 177);
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: bold;
}
.illust-popularity > span::before {
  content: "❤️";
  margin-right: 4px;
}
</style>


