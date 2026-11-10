import { reactive } from 'vue'
import { baiduUser } from './auth.js'

/**
 * 伪百度站点的全局 UI 状态（登录弹窗开关 + 登录态）。
 * 通过一个简单的响应式单例在 App / 首页 / 结果页之间共享。
 */
export const baiduUI = reactive({
  loginDialogVisible: false,
  user: null
})

export function openBaiduLogin() {
  baiduUI.loginDialogVisible = true
}

export function refreshBaiduUser() {
  baiduUI.user = baiduUser()
}
