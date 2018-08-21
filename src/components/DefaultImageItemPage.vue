<template>
  <div id="patchouli-default-image-item-page">
    <DefaultImageItem
      v-for="d in defaultProcessedLibrary"
      v-show="d._show"
      :key="d.illustId"
      :img-url="d.urls.thumb"
      :illust-id="d.illustId"
      :illust-title="d.illustTitle"
      :illust-page-count="d.illustPageCount"
      :is-ugoira="d.isUgoira"
      :user-name="d.userName"
      :user-id="d.userId"
      :profile-img-url="d.profileImg"
      :bookmark-count="d.bookmarkCount"
      :is-bookmarked="d.isBookmarked"
      :is-followed="d.isFollowed"
      :bookmark-id="d.bookmarkId" />
  </div>
</template>

<script>
import DefaultImageItem from './DefaultImageItem.vue';

export default {
  components: { DefaultImageItem },
  computed: {
    defaultProcessedLibrary() {
      return this.$store.getters['pixiv/defaultProcessedLibrary'];
    },
  },
};
</script>

<style scoped>
#patchouli-default-image-item-page {
  display: flex;
  flex-flow: wrap;
  justify-content: space-around;
}
</style>


