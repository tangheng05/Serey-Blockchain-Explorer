import { createApp } from 'vue'
import { createPinia } from 'pinia'
import BootstrapVueNext from 'bootstrap-vue-next'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faHome,
  faUniversity,
  faQuestionCircle,
  faBusinessTime,
  faExclamationTriangle,
  faKey,
  faCheck,
  faTimes,
  faUser,
  faSync,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon, FontAwesomeLayers, FontAwesomeLayersText } from '@fortawesome/vue-fontawesome'

import App from './App.vue'
import router from './router'

library.add(
  faHome,
  faUniversity,
  faQuestionCircle,
  faBusinessTime,
  faExclamationTriangle,
  faKey,
  faCheck,
  faTimes,
  faUser,
  faSync,
)

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(BootstrapVueNext)

app.component('font-awesome-icon', FontAwesomeIcon)
app.component('font-awesome-layers', FontAwesomeLayers)
app.component('font-awesome-layers-text', FontAwesomeLayersText)

app.mount('#app')
