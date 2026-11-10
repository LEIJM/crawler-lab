<script setup>
/**
 * 伪百度登录弹窗（Tangram 风格）
 *
 * DOM 契约（对应 notebook「百度自动化表单」单元格）：
 *   #TANGRAM__PSP_11__userName   用户名输入框
 *   #TANGRAM__PSP_11__password   密码输入框
 *   #TANGRAM__PSP_11__isAgree    协议复选框（可点击的 span）
 *   #TANGRAM__PSP_11__submit     登录提交按钮
 *   #TANGRAM__PSP_11__error      错误提示区域
 */
import { ref, watch } from 'vue'
import { baiduUI, refreshBaiduUser } from '../lib/baidu-ui.js'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const username = ref('')
const password = ref('')
const agreed = ref(false)
const errorMsg = ref('')
const submitting = ref(false)

watch(() => props.modelValue, (v) => {
  if (v) {
    errorMsg.value = ''
    // 打开时清空错误，保留已输入内容便于重试
  }
})

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  errorMsg.value = ''
  if (!username.value.trim()) {
    errorMsg.value = '请输入用户名'
    return
  }
  if (!password.value) {
    errorMsg.value = '请输入密码'
    return
  }
  if (!agreed.value) {
    errorMsg.value = '请阅读并同意《用户服务协议》'
    return
  }
  submitting.value = true
  try {
    const res = await fetch('/api/baidu/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ username: username.value.trim(), password: password.value, agree: agreed.value })
    })
    const data = await res.json()
    if (data.code === 200) {
      refreshBaiduUser()
      emit('update:modelValue', false)
      password.value = ''
    } else {
      errorMsg.value = data.msg || '登录失败，请稍后再试'
    }
  } catch (e) {
    errorMsg.value = '网络异常，请稍后再试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div v-if="modelValue" class="tangram-mask" @click.self="close">
    <div class="tangram-dialog" role="dialog" aria-label="百度帐号登录">
      <div class="tangram-head">
        <p class="tangram-title">登录百度帐号</p>
        <button class="tangram-close" aria-label="关闭" @click="close">×</button>
      </div>

      <div class="tangram-body">
        <div class="tangram-row">
          <input id="TANGRAM__PSP_11__userName" v-model="username" type="text" placeholder="手机号/用户名" autocomplete="off">
        </div>
        <div class="tangram-row">
          <input id="TANGRAM__PSP_11__password" v-model="password" type="password" placeholder="密码" autocomplete="off">
        </div>

        <p id="TANGRAM__PSP_11__error" class="tangram-error" :class="{ show: errorMsg }">{{ errorMsg || ' ' }}</p>

        <div class="tangram-agree-row">
          <span
            id="TANGRAM__PSP_11__isAgree"
            class="agree-checkbox"
            :class="{ checked: agreed }"
            role="checkbox"
            :aria-checked="agreed"
            tabindex="0"
            @click="agreed = !agreed"
            @keydown.enter.prevent="agreed = !agreed"
          ></span>
          <label class="agree-label" for="TANGRAM__PSP_11__isAgree">阅读并接受<a href="javascript:;">《百度用户协议》</a>及<a href="javascript:;">《隐私权保护声明》</a></label>
        </div>

        <button id="TANGRAM__PSP_11__submit" class="tangram-submit" :disabled="submitting" @click="submit">
          {{ submitting ? '登录中…' : '登 录' }}
        </button>

        <p class="tangram-hint">教学提示：模拟站账号 student / 123456</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tangram-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}
.tangram-dialog {
  width: 360px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  font-family: var(--lab-font);
}
.tangram-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 10px;
}
.tangram-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #333;
}
.tangram-close {
  font-size: 22px;
  color: #9aa0a6;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 6px;
}
.tangram-close:hover { background: #f1f3f4; color: #333; }
.tangram-body { padding: 4px 28px 24px; }
.tangram-row input {
  width: 100%;
  height: 44px;
  border: 1px solid #d7d9e0;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 14px;
  margin-bottom: 14px;
  outline: none;
  box-sizing: border-box;
}
.tangram-row input:focus { border-color: #4e6ef2; box-shadow: 0 0 0 2px rgba(78, 110, 242, 0.15); }
.tangram-error {
  margin: -6px 0 10px;
  font-size: 12.5px;
  color: #f5222d;
  visibility: hidden;
  min-height: 18px;
}
.tangram-error.show { visibility: visible; }
.tangram-agree-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 4px 0 16px;
  font-size: 12.5px;
  color: #70757a;
}
.agree-checkbox {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  margin-top: 2px;
  border: 1px solid #b8b9bd;
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  background: #fff;
}
.agree-checkbox.checked { background: #4e6ef2; border-color: #4e6ef2; }
.agree-checkbox.checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.agree-label { line-height: 1.5; cursor: pointer; }
.agree-label a { color: #4e6ef2; }
.tangram-submit {
  width: 100%;
  height: 44px;
  border-radius: 22px;
  background: linear-gradient(90deg, #4e6ef2, #4662fa);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 4px;
}
.tangram-submit:hover { filter: brightness(1.05); }
.tangram-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.tangram-hint {
  margin: 12px 0 0;
  text-align: center;
  font-size: 12px;
  color: #a6adb4;
}
</style>
