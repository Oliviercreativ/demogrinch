<template>
  <div v-if="visible" class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative flex items-center" role="alert">
    <strong class="font-bold">{{ title }}</strong>
    <span class="block sm:inline">{{ message }}</span>
    <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
      <svg @click="closeNotification" class="fill-current h-6 w-6 text-blue-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M14.348 5.652a1 1 0 00-1.414-1.414L10 7.172 7.066 4.238a1 1 0 00-1.414 1.414l2.932 2.932-2.932 2.932a1 1 0 001.414 1.414L10 10.828l2.932 2.932a1 1 0 001.414-1.414l-2.932-2.932 2.932-2.932z"/>
      </svg>
    </span>
  </div>
</template>

<script>

export default {
  props: {
    title: {
      type: String,
      default: 'Succès',
    },
    message: {
      type: String,
      default: '',
    },
    autoClose: {
      type: Boolean,
      default: true,
    },
    duration: {
      type: Number,
      default: 5000,
    },
  },
  data() {
    return {
      visible: true,
    };
  },
  mounted() {
    if (this.autoClose) {
      setTimeout(() => {
        this.visible = false;
      }, this.duration);
    }
  },
  methods: {
    closeNotification() {
      this.visible = false;
    },
  },
};
</script>
