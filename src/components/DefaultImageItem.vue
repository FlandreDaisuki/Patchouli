<template>
  <div class="image-item">
    <figure class="image-item-inner">
      <DefaultImageItemImage
        :img-url="imgUrl"
        :illust-id="illustId"
        :illust-page-count="illustPageCount"
        :is-ugoira="isUgoira"
        :is-bookmarked="isBookmarked"
        :bookmark-id="bookmarkId"/>
      <DefaultImageItemTitle
        :illust-id="illustId"
        :illust-title="illustTitle"
        :user-name="userName"
        :user-id="userId"
        :is-follow="isFollow"
        :profile-img-url="profileImgUrl"
        :bookmark-count="bookmarkCount"
        :page-type="pageType"/>
    </figure>
  </div>
</template>

<script>
import DefaultImageItemImage from "./DefaultImageItemImage.vue";
import DefaultImageItemTitle from "./DefaultImageItemTitle.vue";

export default {
  components: { DefaultImageItemImage, DefaultImageItemTitle },
  props: {
    imgUrl: {
      type: String,
      default: ""
    },
    illustId: {
      type: String,
      default: ""
    },
    illustTitle: {
      type: String,
      default: ""
    },
    illustPageCount: {
      type: Number,
      default: 1
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
    isUgoira: {
      type: Boolean,
      default: false
    },
    isBookmarked: {
      type: Boolean,
      default: false
    },
    isFollow: {
      type: Boolean,
      default: false
    },
    bookmarkId: {
      type: String,
      default: ""
    },
    bookmarkCount: {
      type: Number,
      default: 0
    }
  },
  computed: {
    pageType() {
      return this.$store.state.pageType;
    }
  }
};
</script>

<style scoped>
.image-item {
  display: flex;
  justify-content: center;
  margin: 0 0 30px 0;
  padding: 10px;
  height: auto;
  width: 200px;
}
.image-item-inner {
  display: flex;
  flex-flow: column;
  max-width: 100%;
  max-height: 300px;
}
</style>
