import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import './styles/index.css'
import './styles/home.css'
import './styles/shell.css'

export default {
  extends: DefaultTheme,
  Layout,
}
