import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import StartView from '../views/StartView.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/', name: 'Start', component: StartView
  },
  {
    path: '/play/:rid',
    name: 'Play',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/PlayView.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
