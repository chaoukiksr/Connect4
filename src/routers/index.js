import {createRouter, createWebHistory} from 'vue-router';

import HomeView from '../views/HomeView.vue';
import GameView from '../views/GameView.vue';

const router = createRouter({
   history:createWebHistory(),
   routes:[
      {
         path:'/',
         component:HomeView,
         name:'home'
      },
      {
         path:'/game',
         component:GameView,
         name:'game'
      }
   ]
})

export default router;