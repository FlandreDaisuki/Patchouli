<template>
  <div id="patchouli">
    <DefaultImageItem
      v-for="d in filteredLibrary"
      :key="d.illustId"
      :img-url="d.url.sq240"
      :illust-id="d.illustId"
      :illust-title="d.illustTitle"
      :illust-page-count="d.illustPageCount"
      :is-ugoira="d.isUgoira"
      :user-name="d.userName"
      :user-id="d.userId"
      :profile-img-url="d.profileImg"
      :bookmark-count="d.bookmarkCount"
      :is-bookmarked="d.isBookmarked"
      :is-follow="d.isFollow"
      :bookmark-id="d.bookmarkId" />
    <ContextMenu/>
  </div>
</template>

<script>
import DefaultImageItem from "./DefaultImageItem.vue";
import ContextMenu from "./ContextMenu.vue";

export default {
  components: { DefaultImageItem, ContextMenu },
  computed: {
    filteredLibrary() {
      return this.$store.getters.filteredLibrary;
    }
  }
};
</script>

<style scoped>
#patchouli {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-flow: wrap;
  flex-flow: wrap;
  -ms-flex-pack: distribute;
  justify-content: space-around;
}
</style>
