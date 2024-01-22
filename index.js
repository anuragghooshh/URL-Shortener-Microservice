require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const dns = require("dns");
const urlparser = require("url");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

const uri = process.env.MDB_KEY;
mongoose.connect(uri, {});

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
  },
  short_url: {
    type: Number,
    min: 0,
  },
});

const url = mongoose.model("urlcollections", urlSchema);

// Your first API endpoint
app.get("/api/shorturl/:shorturl_value", function (req, res) {
  url
    .findOne({ short_url: req.params.shorturl_value })
    .then((data) => {
      let redirect_url = data.original_url;
      res.redirect(redirect_url);
    })
    .catch((error) => {
      console.error(error);
    });
});

app.post("/api/shorturl", function (req, res) {
  const postUrl = req.body.url;
  const dnslookup = dns.lookup(
    urlparser.parse(postUrl).hostname,
    (err, address) => {
      if (!address) {
        res.json({ error: "invalid url" });
        return;
      }

      url
        .find()
        .count()
        .then((data) => {
          let tempUrlObj = {
            original_url: postUrl,
            short_url: data + 1,
          };

          new url(tempUrlObj).save();

          res.json(tempUrlObj);
        });
    }
  );
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
