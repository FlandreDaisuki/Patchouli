<template>
  <figcaption class="container">
    <ul>
      <li class="title">
        <a :href="illustPageUrl" :title="illustTitle">{{illustTitle}}</a>
      </li>
      <li v-if="!isMemberIllistPage">
        <a class="user ui-profile-popup" :href="userPageUrl" target="_blank" :title="userName" :data-user_id="userId" :data-user_name="userName">
          <span class="user-img" :style="profileImgStyle"></span>
          <span>{{userName}}</span>
        </a>
      </li>
      <li v-if="bookmarkCount > 0">
        <ul class="count-list">
          <li>
            <a :href="bookmarkDetailUrl" class="_ui-tooltip bookmark-count" :data-tooltip="bookmarkTooltipMsg">
              <i class="_icon sprites-bookmark-badge"></i>{{bookmarkCount}}</a>
          </li>
        </ul>
      </li>
    </ul>
  </figcaption>
</template>

<script>
  export default {
    name: "DefaultImageItemTitle",
    props: {
      illustId: String,
      illustTitle: String,
      userName: String,
      userId: String,
      profileImgUrl: String,
      bookmarkCount: Number,
      bookmarkTooltipMsgFunc: Function,
      pagetype: Symbol
    },
    computed: {
      illustPageUrl() {
        return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
      },
      userPageUrl() {
        return `/member_illust.php?id=${this.userId}`;
      },
      bookmarkDetailUrl() {
        return `/bookmark_detail.php?illust_id=${this.illustId}`;
      },
      bookmarkTooltipMsg() {
        return this.bookmarkTooltipMsgFunc(this.bookmarkCount);
      },
      profileImgStyle() {
        return {
          backgroundImage: `url(${this.profileImgUrl})`
        };
      },
      isMemberIllistPage() {
        return this.pagetype.toString() === "Symbol(MEMBER_ILLIST)"; // work around for build twice
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .container {
    max-width: 100%;
  }
  .title {
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .user {
    font-size: 12px;
    display: inline-flex;
    align-items: center;
  }
  .user-img {
    width: 20px;
    height: 20px;
    display: inline-block;
    background-size: cover;
    border-radius: 50%;
    margin-right: 4px;
  }
</style>
