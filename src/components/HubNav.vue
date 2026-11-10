<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const links = [
  { to: '/', label: '首页' },
  { to: '/playground', label: '选择器练习场' },
  { to: '/challenge', label: '爬虫闯关' },
  { to: '/captcha', label: '验证码练习' },
  { to: '/docs', label: '教学文档' }
]
</script>

<template>
  <header class="hub-nav">
    <div class="lab-container nav-inner">
      <router-link to="/" class="brand">
        <span class="brand-logo">D221</span>
        <span class="brand-text">爬虫教学实训站</span>
        <span class="brand-badge">教学模拟</span>
      </router-link>
      <nav class="nav-links">
        <router-link
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="nav-link"
          :class="{ active: route.path === l.to }"
        >{{ l.label }}</router-link>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.hub-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--lab-line);
}
.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.brand-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  font-weight: 800;
  font-size: 12.5px;
  letter-spacing: 0.2px;
}
.brand-text {
  font-size: 16.5px;
  font-weight: 700;
  color: var(--lab-ink);
}
.brand-badge {
  font-size: 11px;
  color: var(--lab-ink-3);
  border: 1px dashed #cbd5e1;
  border-radius: 999px;
  padding: 1px 8px;
  color: #64748b;
}
.nav-links {
  display: flex;
  gap: 6px;
}
.nav-link {
  padding: 7px 14px;
  border-radius: 9px;
  font-size: 14px;
  color: var(--lab-ink-2);
  text-decoration: none;
  transition: background 0.15s;
}
.nav-link:hover { background: var(--lab-blue-bg); text-decoration: none; }
.nav-link.active {
  background: var(--lab-blue);
  color: #fff;
  font-weight: 600;
}
@media (max-width: 720px) {
  .brand-text { display: none; }
  .nav-link { padding: 7px 10px; font-size: 13px; }
}
</style>
