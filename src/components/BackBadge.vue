<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getCookie, setCookie } from '../lib/auth.js'

const route = useRoute()
/**
 * 徽标默认回到教学首页；
 * 在伪人邮 / 伪百度页面内相互跳转时，则回到各自站点首页。
 */
const target = computed(() => {
  const chrome = route.meta?.chrome
  if (chrome === 'ptpress') return '/shopping/index'
  if (chrome === 'baidu') return '/baidu'
  return '/'
})

function goHome() {
  // 记录来源，供教师分析学生访问路径（仅本站教学用途）
  setCookie('labLastReplica', route.path, 1)
  const last = getCookie('labLastReplica')
  void last
}
</script>

<template>
  <router-link class="back-to-hub" :to="target" @click="goHome">
    <span>⌂</span><span>Data221 实训站</span>
  </router-link>
</template>
