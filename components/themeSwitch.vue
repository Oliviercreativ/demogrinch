<template>
  <div class="flex items-center justify-start">
    <label class="switch">
      <input type="checkbox" :checked="$colorMode.preference === 'dark'" @change="toggleTheme">
      <span class="slider"></span>
    </label>
  </div>
   <div>
  </div>
</template>

<script setup>
const colorMode = useColorMode()
const toggleTheme = () => {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark';
};
console.log(colorMode.preference)
</script>

<style scoped>
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #166534;
}

input:checked + .slider:before {
  transform: translateX(26px);
}
</style>