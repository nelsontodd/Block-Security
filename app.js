var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(80);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', function (socket) {
  //socket.emit('news', { hello: 'world' });
  /*socket.on('my other event', function (data) {
    console.log(data);
  });*/
  var recur = function () {
      console.log("It has been one second!");
      getChainHead(socket);
      setTimeout(recur,10000);

  };
  recur(socket);
});

var http = require('http');
function getChainHead(socket) { //Step #1. Returns chain head ID. Chain head is the latest entry block

    return http.get({
        host: 'localhost',
        port: 8088,
        path: '/v1/chain-head/d382d6a1a1ee53673c16a393efb531b2b65fbea589a132c78b93b5c70f8fe434'
    }, function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
            //console.log('on data');
        });
        response.on('end', function() {

            // Data reception is done, do whatever with it!
            var parsed = JSON.parse(body);
            //console.log(parsed.ChainHead);
            getBlockByKeyMR(parsed, socket);
            // callback(parsed)
        });
    });
  }


function getBlockByKeyMR(entryHash, socket){ //Step #2. Returns list of all entries in this block, and we use this to get the entry hash

  return http.get({
      host: 'localhost',
      port: 8088,
      path: '/v1/entry-block-by-keymr/' + entryHash.ChainHead
  }, function(response) {
      // Continuously update stream with data
      var body = '';
      response.on('data', function(d) {
          body += d;
          //console.log('on data1');
      });
      response.on('end', function() {

          // Data reception is done, do whatever with it!
          var parsed = JSON.parse(body);

          //callback( parsed );
          getEntryContent(parsed.EntryList[0]['EntryHash'], socket);
          //console.log('Entry hash: ' + parsed.Header['BlockSequenceNumber']); //Says block sequence number
      });
  });
}


function getEntryContent(entryHash, socket){ // Step #3. With the entry hash we return the content, unhexed.

  console.log('/v1/entry-by-hash/' + entryHash);
  return http.get({
      host: 'localhost',
      port: 8088,
      path: '/v1/entry-by-hash/' + entryHash
  }, function(response) {
      // Continuously update stream with data
      var body = '';
      response.on('data', function(d) {
          body += d;
          //console.log('on data1');
      });
      response.on('end', function() {

          // Data reception is done, do whatever with it!
          var parsed = JSON.parse(body);

          //callback( parsed );
          console.log('Entry content: ' + hex2a(parsed['Content']));
          socket.emit('news', hex2a(parsed['Content']));
      });
  });
}

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}
