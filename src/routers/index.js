import {createRouter, createWebHistory} from 'vue-router';

import HomeView from '../views/HomeView.vue';
import GameView from '../views/GameView.vue';
import DatabaseView from '../views/DatabaseView.vue';
import RegisterView from '../views/RegisterView.vue';
import BgaView from '../views/BgaView.vue';
import MultiplayerLobbyView from '../views/MultiplayerLobbyView.vue';
import MultiplayerGameView from '../views/MultiplayerGameView.vue';

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
         // Multiplayer lobby — create or join a room
         path:'/multiplayer',
         component:MultiplayerLobbyView,
         name:'multiplayer'
      },
      {
         // Shareable room link — opens the live multiplayer game
         path:'/game/:roomId',
         component:MultiplayerGameView,
         name:'multiplayer-game'
      },
      {
         path:'/database',
         component:DatabaseView,
         name:'database'
      },
      {
         path:'/register',
         component:RegisterView,
         name:'register'
      },
      {
         path:'/bga',
         component:BgaView,
         name:'bga'
      }
   ]
})

export default router;
