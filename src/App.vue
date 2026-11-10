<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import HubNav from './components/HubNav.vue'
import HubFooter from './components/HubFooter.vue'
import BackBadge from './components/BackBadge.vue'
import BaiduLoginDialog from './components/BaiduLoginDialog.vue'
import { baiduUI, refreshBaiduUser } from './lib/baidu-ui.js'

const route = useRoute()
const chrome = computed(() => route.meta?.chrome || 'hub')
const isHub = computed(() => chrome.value === 'hub')
const isBaidu = computed(() => chrome.value === 'baidu')

onMounted(() => {
  refreshBaiduUser()
})
</script>

<template>
  <!-- hub：教学站统一导航 + 页脚 -->
  <template v-if="isHub">
    <HubNav />
    <main class="hub-main">
      <router-view />
    </main>
    <HubFooter />
  </template>

  <!-- replica：伪站点页面（无教学站导航，保留角落徽标便于返回） -->
  <template v-else>
    <router-view />
    <BackBadge />
    <span class="mock-banner-tip">本页为教学模拟站点，仅用于 Data221 课程实训</span>
  </template>

  <!-- 伪百度登录弹窗（挂在全局，/baidu 与 /s 均可用） -->
  <BaiduLoginDialog v-if="isBaidu" v-model="baiduUI.loginDialogVisible" />
</template>

<style scoped>
.hub-main {
  min-height: calc(100vh - 128px);
}
</style>
