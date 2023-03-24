<template>
  <div class="contact-page">
    <h1 class="title">Feedback</h1>
    <p class="description">
      Please submit bug reports and feature requests on Github:
      <a href="https://github.com/InternetHealthReport/ihr-website/issues"
        target="_blank">https://github.com/InternetHealthReport/ihr-website/issues</a>
    </p>
    <h1 class="title">Contact Us</h1>
    <p class="description">
      For questions and inquiries, please contact us at:
      <a href="mailto:admin@ihr.live">admin@ihr.live</a>
    </p>
  </div>
</template>

<script>
export default {
  name: 'ContactView',
  components: {},
  data() {
    return {}
  },
}
</script>

<style scoped>
.contact-page {
  max-width: 800px;
  margin: auto;
  margin-top: 20px;
  padding: 30px;
  background-color: #f5f5f5;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.title {
  font-size: 36px;
  margin-bottom: 20px;
  color: #01111f;
}

.description {
  font-size: 20px;
  line-height: 1.5;
  margin-bottom: 30px;
}

a {
  color: #0078d7;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

@media screen and (max-width: 600px) {
  .contact-page {
    max-width: 90%;
    padding: 20px;
  }

  .title {
    font-size: 28px;
    margin-bottom: 15px;
  }

  .description {
    font-size: 18px;
    margin-bottom: 20px;
  }
}
</style>
