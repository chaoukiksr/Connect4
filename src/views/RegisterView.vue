<template>
  <Navbar />
  <div class="flex flex-col items-center min-h-screen bg-gray-100">
    <div class="mt-10 p-8 bg-white rounded-xl shadow-lg w-96">
      <h2 class="text-2xl font-bold mb-6 text-center">Create Account</h2>
      <form @submit.prevent="registerUser">
        <div class="mb-5">
          <label for="username" class="block mb-2 font-medium">Username</label>
          <input v-model="username" id="username" type="text" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <div class="mb-5">
          <label for="email" class="block mb-2 font-medium">Email</label>
          <input v-model="email" id="email" type="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <div class="mb-5">
          <label for="password" class="block mb-2 font-medium">Password</label>
          <input v-model="password" id="password" type="password" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <button type="submit" class="w-full py-3 mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-md shadow-xl hover:from-emerald-600 hover:to-emerald-700 transition">Register</button>
      </form>
      <div v-if="errorMessage" class="text-red-600 mt-4 text-center">{{ errorMessage }}</div>
      <div v-if="successMessage" class="text-green-700 mt-4 text-center">{{ successMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Navbar from '../components/Navbar.vue';

const username = ref('');
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const successMessage = ref('');

const registerUser = async() =>{
  try {
     const response = await fetch('http://localhost:3000/user/registre', {
        method: "POST",
        body: JSON.stringify({ username: username.value.trim(), email: email.value.trim(), password: password.value.trim() }),
        headers: {
           'Content-Type': 'application/json'
        }
     })
     if(!response.ok){
      console.log("error");
      
     }
     const data = await response.json();
     console.log(data);
  } catch (error) {
   console.log(error);
   
  }
   
}
</script>

<style scoped>
/* No custom styles needed, all handled by Tailwind classes */
</style>
