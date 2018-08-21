<template>
  <div id="patchouli-new-profile-page">
    <nav id="patchouli-npp-nav">
      <a
        id="patchouli-npp-all"
        :class="{'current': navType === 0}"
        :href="`/member.php?id=${uid}`"
        @click.left.prevent="clickRoute">{{ $t('mainView.newProfilePage.contents') }}</a>
      <a
        id="patchouli-npp-illust"
        :class="{'current': navType === 1}"
        :href="`/member_illust.php?id=${uid}&type=illust`"
        @click.left.prevent="clickRoute">{{ $t('mainView.newProfilePage.illustrations') }}</a>
      <a
        id="patchouli-npp-manga"
        :class="{'current': navType === 2}"
        :href="`/member_illust.php?id=${uid}&type=manga`"
        @click.left.prevent="clickRoute">{{ $t('mainView.newProfilePage.manga') }}</a>
      <a
        id="patchouli-npp-bookmark"
        :class="{'current': navType === 3}"
        :href="`/bookmark.php?id=${uid}&rest=show`"
        @click.left.prevent="clickRoute">{{ $t('mainView.newProfilePage.bookmarks') }}</a>
    </nav>
    <div id="patchouli-npp-view">
      <div
        v-show="isSelfBookmarkPage"
        id="patchouli-npp-view-bookmark-switch"
        class="ω">
        <nav>
          <a
            id="patchouli-npp-view-bookmark-switch-public"
            :class="{'current': !isSelfPrivateBookmarkPage}"
            :href="`/bookmark.php?id=${uid}&rest=show`"
            @click.left.prevent="clickRoute">{{ $t('mainView.newProfilePage.publicBookmark') }}</a>
          <a
            id="patchouli-npp-view-bookmark-switch-private"
            :class="{'current': isSelfPrivateBookmarkPage}"
            :href="`/bookmark.php?id=${uid}&rest=hide`"
            @click.left.prevent="clickRoute">{{ $t('mainView.newProfilePage.privateBookmark') }}</a>
        </nav>
      </div>
      <div id="patchouli-npp-view-header"/>
      <ul id="patchouli-npp-view-image-item-list" class="ω">
        <NewDefaultImageItem
          v-for="d in navLibrary"
          v-show="d._show"
          :key="d.illustId"
          :illust-id="d.illustId"
          :bookmark-count="d.bookmarkCount"
          :bookmark-id="d.bookmarkId"
          :is-bookmarked="d.isBookmarked"
          :is-followed="d.isFollowed"
          :is-ugoira="d.isUgoira"
          :illust-page-count="d.illustPageCount"
          :illust-title="d.illustTitle"
          :thumb-img-url="d.urls.thumb"
          :profile-img-url="d.profileImg"
          :user-id="d.userId"
          :user-name="d.userName"
          :nav-type="navType"
          :show-user-profile="uid !== d.userId"/>
        <span v-show="hasNoResult" id="patchouli-npp-view-no-result">
          {{ $t('mainView.newProfilePage.noResult') }}
        </span>
      </ul>
    </div>
  </div>
</template>

<script>
import { MAIN_PAGE_TYPE as MPT } from '../lib/enums';
import { $el, $sp } from '../lib/utils';
import NewDefaultImageItem from './NewDefaultImageItem.vue';

export default {
  components: { NewDefaultImageItem },
  data() {
    return {
      rest: $sp().rest,
      uid: $sp().id,
    };
  },
  // eslint-disable-next-line sort-keys
  computed: {
    hasNoResult() {
      return !this.navLibrary.filter(d => d._show).length;
    },
    isSelfBookmarkPage() {
      return this.$store.getters.isSelfBookmarkPage;
    },
    isSelfPrivateBookmarkPage() {
      return this.isSelfBookmarkPage && this.rest === 'hide';
    },
    navLibrary() {
      const lib = this.$store.getters['pixiv/filteredLibrary'];
      const [shows, hides] = [
        lib.filter(d => d._show),
        lib.filter(d => !d._show),
      ];
      switch (this.navType) {
      case 0:
        shows
          .filter(d => !(d.userId === this.uid))
          .forEach(d => (d._show = false));
        break;
      case 1:
        shows
          .filter(d => !(d.userId === this.uid && !d.isManga))
          .forEach(d => (d._show = false));
        break;
      case 2:
        shows
          .filter(d => !(d.userId === this.uid && d.isManga))
          .forEach(d => (d._show = false));
        break;
      case 3:
        if (this.rest === 'show') {
          shows
            .filter(d => !(d.userId !== this.uid && !d.isPrivateBookmark))
            .forEach(d => (d._show = false));
        } else {
          shows
            .filter(d => !(d.userId !== this.uid && d.isPrivateBookmark))
            .forEach(d => (d._show = false));
        }
        break;
      default:
        break;
      }
      return shows.concat(hides);
    },
    navType() {
      const types = [
        MPT.NEW_PROFILE,
        MPT.NEW_PROFILE_ILLUST,
        MPT.NEW_PROFILE_MANGA,
        MPT.NEW_PROFILE_BOOKMARK,
      ];
      return types.indexOf(this.$store.getters.MPT);
    },
  },
  methods: {
    clickRoute(event) {
      this.$store.commit('pixiv/pause');
      const tid = event.currentTarget.id;
      const thref = event.currentTarget.href;

      if (this.isSamePath(location.href, thref)) {
        return;
      }

      history.pushState(null, '', thref);

      switch (tid) {
      case 'patchouli-npp-all':
        this.$store.commit('setMainPageType', {
          forceSet: MPT.NEW_PROFILE,
        });
        break;
      case 'patchouli-npp-illust':
        this.$store.commit('setMainPageType', {
          forceSet: MPT.NEW_PROFILE_ILLUST,
        });
        break;
      case 'patchouli-npp-manga':
        this.$store.commit('setMainPageType', {
          forceSet: MPT.NEW_PROFILE_MANGA,
        });
        break;
      case 'patchouli-npp-bookmark':
      case 'patchouli-npp-view-bookmark-switch-public':
      case 'patchouli-npp-view-bookmark-switch-private':
        this.rest = $sp().rest;
        this.$store.commit('setMainPageType', {
          forceSet: MPT.NEW_PROFILE_BOOKMARK,
        });
        break;
      default:
        break;
      }

      this.$store.dispatch('pixiv/start', { force: true, times: 1 });
    },
    isSamePath(href0, href1) {
      const a0 = $el('a', { href: href0 });
      const a1 = $el('a', { href: href1 });
      if (a0.pathname !== a1.pathname) {
        return false;
      }
      const sp0 = new URLSearchParams(a0.search);
      const sp1 = new URLSearchParams(a1.search);
      const keysSet = new Set([...sp0.keys(), ...sp1.keys()]);
      for (const k of keysSet) {
        if (sp0.get(k) !== sp1.get(k)) {
          return false;
        }
      }
      return true;
    },
  },
};
</script>

<style scoped>
#patchouli-npp-nav {
  display: flex;
  justify-content: center;
  background-color: #f9f8ff;
  width: 100%;
}
#patchouli-npp-nav > a {
  border-top: 4px solid transparent;
  color: #999;
  font-size: 16px;
  font-weight: 700;
  margin: 0 10px;
  padding: 10px 20px;
  text-decoration: none;
  transition: color 0.2s;
}
#patchouli-npp-nav > a:hover {
  color: #333;
  cursor: pointer;
}
#patchouli-npp-nav > a.current {
  color: #333;
  border-bottom: 4px solid #0096fa;
}
#patchouli-npp-view-bookmark-switch {
  display: flex;
  justify-content: flex-end;
  margin: 24px auto 48px;
  width: 1300px;
}
#patchouli-npp-view-bookmark-switch a.current {
  background-color: #f5f5f5;
  color: #5c5c5c;
}
#patchouli-npp-view-bookmark-switch a {
  border-radius: 24px;
  color: #8f8f8f;
  font-size: 16px;
  font-weight: 700;
  padding: 16px 24px;
  text-decoration: none;
}
#patchouli-npp-view-image-item-list {
  list-style: none;
  display: flex;
  align-content: flex-start;
  justify-content: center;
  flex-wrap: wrap;
  padding: 14px 0;
  margin: 0 auto;
  width: 1300px;
}
#patchouli-npp-view-no-result {
  color: #b8b8b8;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  padding: 30px 0;
}
</style>


