<template>
  <div class="image-item">
    <figure class="image-item-inner">
      <DefaultImageItemImage
        :img-url="imgUrl"
        :illust-id="illustId"
        :illust-page-count="illustPageCount"
        :is-ugoira="isUgoira"
        :is-bookmarked="isBookmarked"
        :is-private-bookmark="isPrivateBookmark"
        :bookmark-id="bookmarkId"/>
      <DefaultImageItemTitle
        :illust-id="illustId"
        :illust-title="illustTitle"
        :user-name="userName"
        :user-id="userId"
        :is-followed="isFollowed"
        :profile-img-url="profileImgUrl"
        :bookmark-count="bookmarkCount"/>
    </figure>
  </div>
</template>

<script>
import DefaultImageItemImage from './DefaultImageItemImage.vue';
import DefaultImageItemTitle from './DefaultImageItemTitle.vue';

export default {
  components: { DefaultImageItemImage, DefaultImageItemTitle },
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
    imgUrl: {
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
    isPrivateBookmark: {
      default: false,
      type: Boolean,
    },
    isUgoira: {
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
