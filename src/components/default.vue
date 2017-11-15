<template>
  <div id="patchouli">
    <DefaultImageItem v-for="d in filteredLibrary" :key="d.illust_id" :imgUrl="d.url.sq240" :illustId="d.illust_id" :illustTitle="d.illust_title" :illustPageCount="d.illust_page_count" :isUgoira="d.is_ugoira" :userName="d.user_name" :userId="d.user_id" :profileImgUrl="d.profile_img" :bookmarkCount="d.bookmark_count" :bookmarkTooltipMsgFunc="bookmarkTooltipMsgFunc" :isBookmarked="d.is_bookmarked" :bookmarkId="d.bookmark_id" :pagetype="pagetype"></DefaultImageItem>
  </div>
</template>

<script>
  import DefaultImageItem from "./default-image-item.vue";
  export default {
    name: "Default",
    components: {
      DefaultImageItem
    },
    props: ["library", "l10n", "pagetype", "filters"],
    computed: {
      bookmarkTooltipMsgFunc() {
        return this.l10n.bookmarkTooltip.bind(this.l10n);
      },
      filteredLibrary() {
        const cloneLibrary = this.library.slice();
        return cloneLibrary
          .filter(el => el.bookmark_count >= this.filters.limit)
          .filter(el => el.tags.match(this.filters.tag))
          .sort(
            (a, b) =>
              Number.toInt(b[this.filters.orderBy]) -
              Number.toInt(a[this.filters.orderBy])
          );
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


