//var request = require('request'),
var express = require('express');
var app = express.createServer(express.logger());
var fs = require("fs");

if (process.env.REDISTOGO_URL) {
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
    var redis = require("redis").createClient(rtg.port, rtg.hostname);
    redis.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require("redis").createClient();
}

var available_cards = fs.readFileSync("cards.json", "utf-8");
var card_data = JSON.parse(available_cards);

var email = require('mailer');

app.use(express.bodyParser());

app.use('/static', express.static(__dirname + '/static')); 


var randomString = function(length) {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = length || 8;
    var randomstring = '';
    for (var i=0; i<string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
    }
    return randomstring;
}


app.get('/', function(req, res) {
    res.render('index.ejs', { layout: false, card_data:card_data});
});

app.get('/email', function(req, res) {
    res.render('email.ejs', { layout: false});
});

app.post('/send', function(req, res){

    if(validateEmail(req.body.toaddress)){

        var urlhash = randomString(8);
        redis.set('postcard:'+urlhash, JSON.stringify({"to":{"name":req.body.toname,
                                                             "address":req.body.toaddress},
                                                       "from":{"name":req.body.fromname,
                                                               "address":req.body.fromaddress},
                                                       "message":req.body.message,
                                                       "card":req.body.card,
                                                       "date":(new Date()).getTime()}));

        //Send email.
        // include the from/to  and link to the message
        var url = "http://cfavalentines.herokuapp.com/card/"+urlhash
        var email_template = fs.readFileSync("views/email.ejs", "utf-8");

        email_template = email_template.replace("{{ toname }}", req.body.toname);
        email_template = email_template.replace("{{ fromname }}", req.body.fromname);
        var email_str = email_template.replace(/\{\{ url \}\}/g, url);

        console.log("email", email_str);
        email.send({
            host: 'smtp.sendgrid.net',
            port: '587',
            authentication: 'plain',
            username: process.env.SENDGRID_USERNAME,
            password: process.env.SENDGRID_PASSWORD,
            domain: 'heroku.com',
            to: req.body.toaddress,
            from: req.body.fromaddress,
            subject: 'Happy Geeky Valentines',
            html: email_str
        }, function (err, result) {
            console.log("sent email", err);
        });
        res.send({"status":"ok"});
    }else{
        res.send({"status":"fail"});
    };
});

var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

app.get('/card/:id', function(req, res) {
    redis.get("postcard:"+req.params.id, function(err, value) {
        if(value == null){
            res.redirect("/");
            return;
        }
        var data = JSON.parse(value);
        var date = new Date(data.date);
        console.log(data);
        var card = card_data.cards[data.card];
        card.name = data.card;
        data.card = card;
        data.datestring = months[date.getMonth()]+ " " + date.getDate()+", "+date.getFullYear();
        res.render('postcard.ejs', { layout: false, data: data});
    });

    
});


app.get('/postcard1', function(req, res) {
/*    redis.get("postcard:"+req.params.id, function(err, value) {
        if(value == null){
            res.redirect("/");
            return;
        }
        var data = JSON.parse(value);
        var date = new Date(data.date);
        data.datestring = months[date.getMonth()]+ " " + date.getDate()+", "+date.getFullYear();
*/
    var card = card_data.cards["open_data"];
    card.name = "open_data";
    var data = {"to":{"name":"To Name",
                      "address":"to@address"},
                "from":{"name":"from name",
                        "address":"from@address"},
                "message":"test message",
                "card":card,               
                "date":(new Date()).getTime()};

    res.render('postcard.ejs', { layout: false, data: data});

    
});


function validateEmail(elementValue){  
   var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;  
   return emailPattern.test(elementValue);  
} 

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
