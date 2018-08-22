<template>
  <div :id="id">
    <NewProfilePage v-if="isNewProfilePage"/>
    <DefaultImageItemPage v-else/>
    <ContextMenu/>
  </div>
</template>

<script>
import ContextMenu from './ContextMenu.vue';
import DefaultImageItemPage from './DefaultImageItemPage.vue';
import NewProfilePage from './NewProfilePage.vue';

export default {
  components: { ContextMenu, DefaultImageItemPage, NewProfilePage },
  props: {
    id: {
      default: '',
      type: String,
    },
  },
  // eslint-disable-next-line sort-keys
  computed: {
    isNewProfilePage() {
      return this.$store.getters['pixiv/nppType'] >= 0;
    },
  },
};
</script>

<style scoped>
</style>
