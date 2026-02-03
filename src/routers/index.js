import {createRouter, createWebHistory} from 'vue-router';

import HomeView from '../views/HomeView.vue';
import GameView from '../views/GameView.vue';
import DatabaseView from '../views/DatabaseView.vue';

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
      },
      {
         path:'/database',
         component:DatabaseView,
         name:'database'
      }
   ]
})

export default router;