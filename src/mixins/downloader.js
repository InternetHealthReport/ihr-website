
export const downloader = {
  data: function () {
    return {
        apiUrl: 'https://ihr.iijlab.net/ihr/api/',
    }
  },

  methods: {
    apiGetData: function(apiPoint, params, dataHandler){
        params["format"] = "json";
        if( params["page"] === undefined ){
            params["page"] = 1
        }
        this.$http.get( this.apiUrl+apiPoint, { params: params}).then(
            function(response) {
                dataHandler(response.data)

                if(response.data.next){
                    params["page"]++
                    this.apiGetData(apiPoint, params, dataHandler)
                }
            },
            function(err) {
                console.log("error happened");
                console.log(err)
            }
        )
    }
  }
}

