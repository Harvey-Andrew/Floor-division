import { createRouter, createWebHashHistory } from "vue-router";
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/setBuild",
      name: "setBuild",
      component: () =>
        import(/* webpackChunkName: "setBuild" */ "../views/SetBuild.vue"),
    },
    {
      path: "/setInfo",
      name: "setInfo",
      component: () =>
        import(/* webpackChunkName: "setInfo" */ "../views/SetInfo.vue"),
    },
    {
      path: "/house",
      name: "house",
      component: () =>
        import(/* webpackChunkName: "house" */ "../views/House.vue"),
    },
  ],
});

export default router;
