import { createApp } from 'vue'

import App from './App.vue'
import { router } from './app/router'
import './styles/main.css'
import './styles/liquid.css'
import './styles/practice.css'

createApp(App).use(router).mount('#app')
