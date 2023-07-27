<template>
    <div class="banner">
      <p>
        We use cookies to ensure you get the best experience on our website.
      </p>
      <button type="button" @click="acceptCookies">Accept cookies</button>
    </div>
  </template>
  
  <script>
  export default {
    name: "CookieBanner",
    methods: {
      acceptCookies() {
        localStorage.setItem("cookiesAccepted", true);
        this.$parent.showBanner = false;
        window.location.reload();
    }
    }
  
  };
  </script>

  <style scoped>
    .banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: #333;
        color: #fff;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 9999;
    }   
    .banner p {
        margin: 0;
    }

    .banner button {
        background-color: #fff;
        color: #333;
        border: 0;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        margin-left: 1rem;
        cursor: pointer;
    }

    .banner button:hover {
        background-color: #eee;
    }

    .banner button:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
    }

    .banner button:active {
        background-color: #ddd;
    }

    .banner button::-moz-focus-inner {
        border: 0;
    }

    .banner button:active {
        outline: none;
        box-shadow: none;
    }

    </style>