<script setup>
/**
 * 图书卡片 —— DOM 契约（对应 notebook「人民邮电出版社」单元格）：
 *   结构必须满足 CSS 选择器 `.book_item > a > p`：
 *   .book_item 的直接子元素 a 中包含唯一的 p（书名）。
 *   价格、作者等元素放在 a 之外，避免被 `> a > p` 一并抓走。
 */
import { computed } from 'vue'
import { coverGradient } from '../data/books.js'

const props = defineProps({ book: { type: Object, required: true } })
const gradient = computed(() => coverGradient(props.book.isbn))
const initials = computed(() => props.book.title.replace(/[（(].*$/, '').slice(0, 2))
</script>

<template>
  <div class="book_item">
    <a :href="`/shopping/detail?isbn=${book.isbn}`" class="book_link">
      <div class="book_img" :style="{ background: gradient }">
        <span class="book_img_text">{{ initials }}</span>
      </div>
      <p class="book_name" :title="book.title">{{ book.title }}</p>
    </a>
    <p class="book_price">￥{{ book.price.toFixed(2) }}</p>
    <p class="book_author">{{ book.author }}</p>
  </div>
</template>

<style scoped>
.book_item {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 14px 12px 10px;
  transition: box-shadow 0.2s, transform 0.2s;
}
.book_item:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.09);
  transform: translateY(-3px);
}
.book_link { display: block; text-decoration: none; }
.book_img {
  height: 150px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.92);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 4px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}
.book_name {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.45;
  color: #333;
  height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.book_price { margin: 6px 0 0; font-size: 16px; color: #e1251b; font-weight: 600; }
.book_author { margin: 2px 0 0; font-size: 12px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
