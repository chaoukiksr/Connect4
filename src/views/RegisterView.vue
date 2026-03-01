<template>
  <Navbar />
  <div class="flex flex-col items-center min-h-screen bg-gray-100">
    <div class="mt-10 p-8 bg-white rounded-xl shadow-lg w-96">
      <h2 class="text-2xl font-bold mb-6 text-center">
        {{ isLoginMode ? 'Login to your Account' : 'Create Account' }}
      </h2>
      <form @submit.prevent="isLoginMode ? loginUser() : registerUser()">
        <div v-if="!isLoginMode" class="mb-5">
          <label for="username" class="block mb-2 font-medium">Username</label>
          <input v-model="username" id="username" type="text" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <div  class="mb-5">
          <label for="email" class="block mb-2 font-medium">Email</label>
          <input v-model="email" id="email" type="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <div class="mb-5">
          <label for="password" class="block mb-2 font-medium">Password</label>
          <input v-model="password" id="password" type="password" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <button type="submit" class="w-full py-3 mt-2 bg-linear-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-md shadow-xl hover:from-emerald-600 hover:to-emerald-700 transition">
          {{ isLoginMode ? 'Login' : 'Register' }}
        </button>
      </form>
      <div class="flex justify-center mt-4">
        <button @click="toggleMode" class="text-emerald-600 hover:underline focus:outline-none">
          {{ isLoginMode ? "Don't have an account? Register" : 'Already have an account? Login' }}
        </button>
      </div>
    </div>

    <!-- Feedback Modal -->
    <div v-if="showModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div class="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
        <div v-if="modalType === 'success'">
          <div class="text-emerald-600 text-3xl mb-2">✔</div>
          <div class="text-lg font-semibold mb-2">{{ modalMessage }}</div>
        </div>
        <div v-else-if="modalType === 'error'">
          <div class="text-red-600 text-3xl mb-2">✖</div>
          <div class="text-lg font-semibold mb-2">{{ modalMessage }}</div>
        </div>
        <button @click="showModal = false" class="mt-4 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '../components/Navbar.vue';
const router = useRouter();

const username = ref('');
const email = ref('');
const password = ref('');
const isLoginMode = ref(true);

// Modal state
const showModal = ref(false);
const modalType = ref('success'); // 'success' | 'error'
const modalMessage = ref('');

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
  // Clear fields and feedback
  username.value = '';
  email.value = '';
  password.value = '';
};

const registerUser = async () => {
  try {
    const response = await fetch('http://localhost:3000/user/registre', {
      method: "POST",
      body: JSON.stringify({ username: username.value.trim(), email: email.value.trim(), password: password.value.trim(), role: "user" }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const errorData = await response.json();
      modalType.value = 'error';
      modalMessage.value = errorData.message || 'Registration failed.';
      showModal.value = true;
      return;
    }
    const data = await response.json();
    modalType.value = 'success';
    modalMessage.value = data.message || 'Account created successfully!';
    showModal.value = true;
    // Optionally, switch to login mode after success
    setTimeout(() => {
      showModal.value = false;
      isLoginMode.value = true;
      username.value = '';
      email.value = '';
      password.value = '';
    }, 1500);
  } catch (error) {
    modalType.value = 'error';
    modalMessage.value = 'An error occurred during registration.';
    showModal.value = true;
  }
};

const loginUser = async () => {
  try {
    const response = await fetch('http://localhost:3000/user/login', {
      method: "POST",
      body: JSON.stringify({ email: email.value.trim(), password: password.value.trim() }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const errorData = await response.json();
      modalType.value = 'error';
      modalMessage.value = errorData.message || 'Login failed.';
      showModal.value = true;
      return;
    }
    const data = await response.json();
    modalType.value = 'success';
    modalMessage.value = data.message || 'Login successful!';
    showModal.value = true;
    localStorage.setItem('token', data.token);
    if (data.role) {
      localStorage.setItem('role', data.role);
    }
    // Redirect based on role after short delay
    setTimeout(() => {
      showModal.value = false;
      if (data.role === 'admin') {
        router.push({ name: 'database' });
      } else {
        router.push({ name: 'home' });
      }
    }, 1500);
  } catch (error) {
    modalType.value = 'error';
    modalMessage.value = 'An error occurred during login.';
    showModal.value = true;
  }
};
</script>

<style scoped>
/* No custom styles needed, all handled by Tailwind classes */
</style>
