<template>
  <figcaption class="image-item-title-user">
    <ul>
      <li class="title-text" @click.right="activateContextMenu">
        <a :href="illustPageUrl" :title="illustTitle">{{ illustTitle }}</a>
      </li>
      <li
        class="user-info"
        @click.right="activateContextMenu"
      >
        <a
          :href="userPageUrl"
          :title="userName"
          :data-user_id="userId"
          :data-user_name="userName"
          :class="isEnableUserTooltip ? 'ui-profile-popup' : ''"
          class="user-link"
          rel="noreferrer noopener"
          target="_blank"
        >
          <span :style="profileImgStyle" class="user-img" />
          <span>{{ userName }}</span>
        </a>
        <FontAwesomeIcon
          v-if="isFollowed"
          :icon="'rss'"
          class="user-followed-indicator"
        />
      </li>
      <li v-if="bookmarkCount > 0">
        <ul class="count-list">
          <li>
            <a
              :href="bookmarkDetailUrl"
              :data-tooltip="$t('mainView.bookmarkTooltip', { count: bookmarkCount })"
              class="_ui-tooltip bookmark-count"
            >
              <i class="_icon _bookmark-icon-inline" />
              {{ bookmarkCount }}
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </figcaption>
</template>

<script>
import { $print } from '../lib/utils';

// import FaRSS from './icons/FaRSS.vue';
import FontAwesomeIcon from './FontAwesomeIcon.vue';

export default {
  components: { FontAwesomeIcon },
  props: {
    bookmarkCount: {
      default: 0,
      type: Number,
    },
    illustId: {
      default: '',
      type: String,
    },
    illustTitle: {
      default: '',
      type: String,
    },
    isFollowed: {
      default: false,
      type: Boolean,
    },
    profileImgUrl: {
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
  computed: {
    bookmarkDetailUrl() {
      return `/bookmark_detail.php?illust_id=${this.illustId}`;
    },
    bookmarkTooltipMsg() {
      return this.$t('mainView.bookmarkTooltip', {
        count: this.bookmarkCount,
      });
    },
    illustPageUrl() {
      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
    },
    isEnableUserTooltip() {
      return this.$store.state.config.userTooltip;
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
  methods: {
    activateContextMenu(event) {
      $print.debug('DefaultImageItemTitle#activateContextMenu', event);
      if (this.$store.state.config.contextMenu) {
        event.preventDefault();

        const payload = {
          position: {
            x: event.clientX,
            y: event.clientY,
          },
        };

        const ct = event.currentTarget;
        if (ct.classList.contains('user-info')) {
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
  },
};
</script>

<style scoped>
.image-item-title-user {
  max-width: 100%;
  margin: 8px auto;
  text-align: center;
  color: #333;
  font-size: 12px;
  line-height: 1;
}
.title-text {
  margin: 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
}
.user-info {
  display: inline-flex;
  align-items: center;
}
.user-link {
  font-size: 12px;
  display: inline-flex;
  align-items: center;
}
.user-img {
  width: 20px;
  height: 20px;
  display: inline-block;
  background-size: cover;
  border-radius: 50%;
  margin-right: 4px;
}
.user-followed-indicator {
  display: inline-block;
  margin-left: 4px;
  width: 16px;
  height: 16px;
  color: dodgerblue;
}
</style>
