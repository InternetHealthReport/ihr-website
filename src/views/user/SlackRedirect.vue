<template>
    <div class="container">
        <div class="row">
            <div class="col-md-12 redirect">
                <!-- <img src="discord.png" alt="discord" style="width: 100%; height: 100%;"/> -->
                <img src="../../assets/imgs/slack.png" alt="slack" style="width: 50%;height: 50%;" />
                <h1>Slack Redirect</h1>
                <p>We have successfully get the code to join your channel. <br/>when there is an alert, we will send it to you through discord</p>
                <button class="home" @click="ReturnHome()" >
                    Return to Home Page
                </button>
            </div>
        </div>
    </div>
</template>

<script>

export default {
  data() {
    return {
      code: ""
    }
  },
  mounted() {
  },
  methods: {
    getCode () {
      this.code = this.$route.query.code
      this.$ihr_api.userSlack(
        this.code,
        (res) => {
          console.log(res)
        },
        (err) => {
          console.log(err)
        }
      )
    },
    ReturnHome () {
      this.$router.push({ path: '/' })
    }
  },
  beforeMount() {
    this.getCode()
  }
}
</script>

<style scoped>
.redirect{
    text-align: center;
    margin: 1rem 0;
    gap: 1rem;
}

.home{
    background-color: #7289da;
    border: none;
    color: white;
    padding: 15px 32px;
    text-align: center;
    text-decoration: none;
    font-size: 16px;
    cursor: pointer;
    border-radius: 12px;
    margin-top: 1rem;
}

.home:hover{
    background-color: #5a68a5;
}
</style>
