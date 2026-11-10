<script setup>
</script>

<template>
  <footer class="hub-footer">
    <div class="lab-container footer-inner">
      <div class="footer-line">
        <span>Data221 · Selenium 自动化爬取教学实训站</span>
        <span class="dot">·</span>
        <span>仅供课堂教学与实训使用，页面为模拟环境，数据均为虚构</span>
      </div>
      <div class="footer-links">
        <router-link to="/docs">教学文档</router-link>
        <router-link to="/playground">选择器练习场</router-link>
        <router-link to="/challenge">爬虫闯关</router-link>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.hub-footer {
  border-top: 1px solid var(--lab-line);
  background: #fff;
  margin-top: 48px;
}
.footer-inner {
  padding: 22px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12.5px;
  color: var(--lab-ink-3);
}
.footer-line .dot { margin: 0 6px; }
.footer-links { display: flex; gap: 16px; }
.footer-links a { color: var(--lab-ink-3); }
.footer-links a:hover { color: var(--lab-blue); }
</style>
