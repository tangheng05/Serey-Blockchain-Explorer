<template>
  <div>
    <b-modal v-model="showTop50Modal" hide-footer title="Top50">
      <div class="text-end">
        <select v-model="sel_top50">
          <option value="post">Top50 posts</option>
          <option value="comment">Top50 comments</option>
          <option value="post_down">Top50 downvoted posts</option>
          <option value="comment_down">Top50 downvoted comments</option>
        </select>
      </div>
      <div class="row mt-3" v-for="(item, index) in top50" :key="index">
        <div class="col-md-1 align-middle">#{{index}}</div>
        <div class="col-md-8">
          <div>
            <router-link :to="item.url" class="text-break">{{item.title}}</router-link>
          </div>
          <small class="text-secondary">@{{item.author}} - #{{item.category}}</small>
        </div>
        <div class="col-md-3">
          <div class="text-end text-success"><small>+ ${{item.upvotes}}</small></div>
          <div class="text-end text-danger"><small>- ${{item.downvotes}}</small></div>
          <div class="text-end">{{item.finalPayout}}</div>
        </div>
      </div>
    </b-modal>

    <AppHeader ref="appHeader" />
    <div class="container">
      <h2>Reports</h2>
      <div class="alert alert-warning">
        Reports feature requires Firebase integration which is not configured in this build.
      </div>
    </div>
  </div>
</template>

<script>
import AppHeader from '@/components/layout/AppHeader'

export default {
  name: 'ReportsPage',
  components: { AppHeader },

  data() {
    return {
      showTop50Modal: false,
      sel_top50: 'post',
      top50: [],
    }
  },
}
</script>
