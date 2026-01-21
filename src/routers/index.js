import {createRouter, createWebHistory} from 'vue-router';

import HomeView from '../views/HomeView.vue';
import Game from '../views/Game.vue';

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
         component:Game,
         name:'game'
      }
   ]
})

export default router;