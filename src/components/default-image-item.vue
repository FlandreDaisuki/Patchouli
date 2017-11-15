<template>
  <div class="image-item">
    <figure class="image-item-inner">
      <DefaultImageItemImage :imgUrl="imgUrl" :illustId="illustId" :illustPageCount="illustPageCount" :isUgoira="isUgoira" :isBookmarked="isBookmarked" :bookmarkId="bookmarkId"></DefaultImageItemImage>
      <DefaultImageItemTitle :illustId="illustId" :illustTitle="illustTitle" :userName="userName" :userId="userId" :profileImgUrl="profileImgUrl" :bookmarkCount="bookmarkCount" :bookmarkTooltipMsgFunc="bookmarkTooltipMsgFunc" :pagetype="pagetype"></DefaultImageItemTitle>
    </figure>
  </div>
</template>

<script>
  import DefaultImageItemImage from "./default-image-item-image.vue";
  import DefaultImageItemTitle from "./default-image-item-title.vue";
  export default {
    name: "DefaultImageItem",
    components: {
      DefaultImageItemImage,
      DefaultImageItemTitle
    },
    props: {
      imgUrl: String,
      illustId: String,
      illustTitle: String,
      illustPageCount: Number,
      isUgoira: Boolean,
      isBookmarked: Boolean,
      userName: String,
      userId: String,
      profileImgUrl: String,
      bookmarkCount: Number,
      bookmarkTooltipMsgFunc: Function,
      bookmarkId: { type: String, default: "" },
      pagetype: Symbol
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
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
  }
</style>
