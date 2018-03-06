<template>
  <figcaption class="image-item-title">
    <ul>
      <li class="title-text">
        <a :href="illustPageUrl" :title="illustTitle">{{ illustTitle }}</a>
      </li>
      <li v-if="!isMemberIllistPage">
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
      </li>
      <li v-if="bookmarkCount > 0">
        <ul class="count-list">
          <li>
            <a
              class="_ui-tooltip bookmark-count"
              :href="bookmarkDetailUrl">
              <!-- :data-tooltip="bookmarkTooltipMsg"> -->
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
      default: ''
    },
    illustTitle: {
      type: String,
      default: ''
    },
    userName: {
      type: String,
      default: ''
    },
    userId: {
      type: String,
      default: ''
    },
    profileImgUrl: {
      type: String,
      default: ''
    },
    bookmarkCount: {
      type: Number,
      default: 0
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
    // bookmarkTooltipMsg() {
    //   return this.bookmarkTooltipMsgFunc(this.bookmarkCount);
    // },
    profileImgStyle() {
      return {
        backgroundImage: `url(${this.profileImgUrl})`
      };
    },
    isMemberIllistPage() {
      return this.$store.state.pageType === 'MEMBER_ILLIST';
    }
  }
};
</script>

<style scoped>

</style>


