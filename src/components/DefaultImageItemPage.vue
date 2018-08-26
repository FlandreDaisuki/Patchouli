<template>
  <div id="patchouli-default-image-item-page">
    <DefaultImageItem
      v-for="(d, index) in defaultProcessedLibrary"
      v-show="index < imageToShowCount"
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
      const { shows, hides } = this.$store.getters[
        'pixiv/defaultDisplayIndices'
      ];
      const iiLib = this.$store.getters['pixiv/imageItemLibrary'];

      return shows.concat(hides).map(idx => iiLib[idx]);
    },
    imageToShowCount() {
      const { shows } = this.$store.getters['pixiv/defaultDisplayIndices'];
      return shows.length;
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


