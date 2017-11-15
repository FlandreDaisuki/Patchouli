<template>
  <div class="container">
    <a :href="illustPageUrl" rel="noopener" class="link">
      <div class="multiple" v-if="illustPageCount > 1">
        <span>
          <span class="multiple-icon"></span>
          {{illustPageCount}}
        </span>
      </div>
      <img class="img" :data-src="imgUrl" :src="imgUrl">
      <div class="ugoira" v-if="isUgoira"></div>
    </a>
    <div class="bookmark _one-click-bookmark" :class="{on:selfIsBookmarked}" @click="oneClickBookmarkAdd" data-click-action="illust" :data-click-label="illustId" data-type="illust" :data-id="illustId" :title="selfIsBookmarked"></div>
    <div class="bookmark-input-container" v-if="bookmarkId">
      <input name="book_id[]" :value="bookmarkId" type="checkbox">
    </div>
  </div>
</template>

<script>
  export default {
    name: "DefaultImageItemImage",
    props: {
      imgUrl: String,
      illustId: String,
      illustPageCount: Number,
      isUgoira: Boolean,
      isBookmarked: Boolean,
      bookmarkId: String
    },
    data() {
      return {
        selfIsBookmarked: this.isBookmarked
      };
    },
    computed: {
      illustPageUrl() {
        return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
      }
    },
    methods: {
      oneClickBookmarkAdd() {
        if (!selfIsBookmarked) {
          selfIsBookmarked = true;
        }
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .multiple {
    position: absolute;
    right: 0;
    top: 0;
    background: rgba(0, 0, 0, 0.4);
    padding: 6px;
    color: #fff;
    border-radius: 0 0 0 4px;
    font-weight: 700;
  }
  .multiple-icon {
    background: url(https://source.pixiv.net/www/js/bundle/0d96c2a49f75a8fa27d0424549169573.svg);
    width: 10px;
    height: 10px;
    display: inline-block;
  }
  .img {
    max-height: 200px;
    max-width: 200px;
    object-fit: cover;
  }
  .link {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 200px;
    max-height: 200px;
    border: 1px solid rgba(0, 0, 0, 0.04);
  }
  .ugoira {
    background: url(https://source.pixiv.net/www/js/bundle/70ae15bac4e2e134bbf9d5727859f1fc.svg);
    position: absolute;
    width: 40px;
    height: 40px;
  }

  .bookmark {
    right: 0;
  }

  .bookmark-input-container {
    position: absolute;
    left: 0;
    top: 0;
    background: rgba(0, 0, 0, 0.4);
    padding: 6px;
    border-radius: 0 0 4px 0;
  }
</style>
