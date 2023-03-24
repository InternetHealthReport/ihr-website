<template>
  <div>
    <h2 style="color: grey; font-size: 2rem; font-weight: bold; text-align: left; margin-left: 20px; margin-top: 2rem; ">News on Internet Security</h2>
    <div class="card-deck">
      <div v-for="(article, index) in articles.slice(0,12)" :key="index" class="card">
        <div class="card-image">
          <!-- <img :src="article.urlToImage" alt="Article Image" /> -->
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ article.data.title }}</h3>
          <p class="card-description">{{ article.description }}</p>
          <a :href="article.data.url" ><span class="card-link">Read More</span></a>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.card-deck {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -15px 80px 50px;
}

.card {
  width: calc(33.333% - 30px);
  margin: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.card-image img {
  width: 100%;
  height: auto;
}

.card-content {
  padding: 20px;
}

.card-title {
  margin: 0 0 10px;
  font-size: 1.4rem;
  font-weight: bold;
  line-height: 1.3;
}

.card-description {
  margin: 0 0 15px;
  font-size: 1.2rem;
  line-height: 1.5;
}

.card-link {
  display: inline-block;
  padding: 10px 15px;
  background-color: #007bff;
  color: #fff;
  font-size: 1.2rem;
  border-radius: 5px;
  transition: all 0.3s ease;
}

.card-link:hover {
  background-color: #0056b3;
}
/* Responsive layout for the card deck */
@media screen and (max-width: 768px) {
  .card-deck {
    display: flex;
    flex-wrap: wrap;
    margin: 0;
  }

  .card {
    width: 100%;
    margin: 0 0 20px;
  }
}

/* Responsive layout for the cards */
@media screen and (min-width: 769px) and (max-width: 991px) {
  .card {
    width: calc(50% - 30px);
    margin: 15px;
  }
}

@media screen and (min-width: 992px) {
  .card {
    width: calc(33.333% - 30px);
    margin: 15px;
  }
}

</style>

<script>
export default {
  name: 'NewsCard',
  data() {
    return {
      articles: [],
    };
  },
  created() {
    this.fetchNews();
  },
  methods: {
    async fetchNews() {
      const apiKey = 'YOUR_API_KEY'; // Replace with your News API key
      const response = await fetch('https://www.reddit.com/r/netsec/search.json?q=internet%20security&restrict_sr=1', {
        headers: {
          'User-Agent': 'MyApp/1.0.0'
        }
      });
      const data = await response.json();
      this.articles = data.data.children;
    },
  },
};
</script>







