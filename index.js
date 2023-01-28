const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const elasticClient = require("./client");
app.use(bodyParser.json());




app.get('/', function (req, res) {
  res.send('Welcome to Search API');
});

app.get('/health', async (req, res) => {
  try {
    const result = await elasticClient.cluster.health({
      wait_for_status: 'yellow',
      timeout: '50s'
    })

    if (result.status == "yellow" || result.status == "green") {
      res.send("{status:healthy}");
    }
    else {
      res.status(500).send("{status:unhealthy,reason:INSTABLE BACKEND}")
    }
  }
  catch (err) {
    res.status(500).send("{status:unhealthy,reason:BROKEN BACKEND}")
  }
});

app.get("/search", async (req, res) => {
  console.log(req.query.q);
  var q = req.query.q.split(',');
  var str ='';
  var cat = '';
  q.forEach(e => {
    var str1 = e.split('=')
    console.log(str1[0],':  ', str1[1]);
    if(str1[0]=='s'){
      str=str1[1]
    }
    if(str1[0]=='c'){
      cat=str1[1]
    }
  });

  console.log(str);


  query = str + " OR " + cat

  const result = await elasticClient.search({
    index: "products",
    query: {
      "bool": {
        "must": [
          {
              "term": {"size": cat}
          }],
        "should": [
          {
            "match": {
              "name" : {
                "query" :  str,
                "fuzziness": "1"
              }
            }
          }
        ],

      }
    },
  });

  res.json(result);
});

app.get("/products", async (req, res) => {
  const result = await elasticClient.search({
    index: "products",
    query: { match_all: {} },
  });

  res.send(result);
});


app.listen(3000, function () {
  console.log('App listening for requests...');
});
