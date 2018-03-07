<template>
  <figcaption class="image-item-title">
    <ul>
      <li class="title-text">
        <a :href="illustPageUrl" :title="illustTitle">{{ illustTitle }}</a>
      </li>
      <li class="user-info" v-if="!isMemberIllistPage">
        <a
          class="user-link ui-profile-popup"
          target="_blank"
          :href="userPageUrl"
          :title="userName"
          :data-user_id="userId"
          :data-user_name="userName">
          <span class="user-img" :style="profileImgStyle"/>
          <span>{{ userName }}</span>
        </a>
        <i class="follow-icon" v-if="isFollow"/>
      </li>
      <li v-if="bookmarkCount > 0">
        <ul class="count-list">
          <li>
            <a
              class="_ui-tooltip bookmark-count"
              :href="bookmarkDetailUrl"
              :data-tooltip="$t('patchouli.bookmarkTooltip', { count: bookmarkCount })">
              <i class="_icon _bookmark-icon-inline"/>
              {{ bookmarkCount }}
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </figcaption>
</template>

<script>
export default {
  props: {
    illustId: {
      type: String,
      default: ""
    },
    illustTitle: {
      type: String,
      default: ""
    },
    userName: {
      type: String,
      default: ""
    },
    userId: {
      type: String,
      default: ""
    },
    profileImgUrl: {
      type: String,
      default: ""
    },
    bookmarkCount: {
      type: Number,
      default: 0
    },
    isFollow: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    illustPageUrl() {
      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
    },
    userPageUrl() {
      return `/member_illust.php?id=${this.userId}`;
    },
    bookmarkDetailUrl() {
      return `/bookmark_detail.php?illust_id=${this.illustId}`;
    },
    bookmarkTooltipMsg() {
      return this.$t("patchouli.bookmarkTooltip", {
        count: this.bookmarkCount
      });
    },
    profileImgStyle() {
      return {
        backgroundImage: `url(${this.profileImgUrl})`
      };
    },
    isMemberIllistPage() {
      return this.$store.state.pageType === "MEMBER_ILLIST";
    }
  }
};
</script>

<style scoped>
.image-item-title {
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
.follow-icon {
  display: inline-block;
  margin-left: 4px;
  width: 14px;
  height: 14px;
  background-color: dodgerblue;
  mask-image: url(https://cdnjs.cloudflare.com/ajax/libs/simple-icons/3.0.1/rss.svg);
}
</style>


