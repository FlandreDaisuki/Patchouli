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
      :bookmark-id="d.bookmarkId" />
      <!-- :bookmark-tooltip-msg-func="bookmarkTooltipMsgFunc" -->
  </div>
</template>

<script>
import DefaultImageItem from "./DefaultImageItem.vue";

export default {
  components: { DefaultImageItem },
  computed: {
    filteredLibrary() {
      return this.$store.getters.filteredLibrary;
    }
  }
};
</script>

<style scoped>
#patchouli {
  display: flex;
  flex-flow: wrap;
  justify-content: space-around;
}
</style>


