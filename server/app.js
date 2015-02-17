var express = require('express'),
  app = express(),
  path = require('path'),
  Ansible = require('node-ansible'),
  application = [{
    name: 'Photoshop'
  }],
  sshConf = require('./config/user.json'),
  config = require('./config/config.json'),
  //hostPath = path.join(__dirname,'config','hosts');
hostPath = "/Users/gabrielstuff/Sources/node/fechty/server/config/hosts",
  sshClient = require('ssh2').Client;


var parseResult = function(result, applicationName) {
  var splitted = result.output.split('>>'),
    res = {
      code: result.code,
      machine: {
        address: splitted[0].split('|')[0].trim(),
        status: splitted[0].split('|')[1].trim()
      }
    };

  try {
    var json = JSON.parse(result.output.split('>>')[1]);
    res.machine.value = json;
  } catch (err) {
    res.error = err;
  }

  if (applicationName !== undefined) {
    res.application = applicationName;
  }
  console.log('parseResult: ', res);
  return res;
};

var sshExec = function(command, machineName, res, req) {
  var connectionInfos = {
      host: machineName,
      port: sshConf.connection.port,
      username: sshConf.connection.user.username,
      password: sshConf.connection.user.password
    },
    error = "",
    stdout = "",
    response = {};

  console.log('command: ', command, machineName, connectionInfos);
  var conn = new sshClient();
  conn.on('ready', function() {
      console.log('Client :: ready');
      conn.exec(command, { pty: true }, function(err, stream) {
        if (err) throw err;
        stream
          .on('close', function(code, signal) {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
          })
          .on('end', function() {
            if (responseCode === 500) {
              response = {
                "data": "",
                "err": error
              };
            } else {
              response = {
                "data": stdout,
                "err": ""
              };
            }
            res
              .status(responseCode)
              .json(response);
          })
          .on('data', function(data) {
            console.log('STDOUT: ' + data);
            stdout += data;
            responseCode = 200;
          }).stderr.on('data', function(data) {
            console.log('STDERR: ' + data);
            responseCode = 500;
            error += data;
          });
      });
    })
    .on('error', function(err) {
      console.log(err)
      res
        .status(500)
        .json({
          data: "",
          err: err
        });
    }).connect(connectionInfos);
}



app.get('/test/:host', function(req, res) {
  var host = req.params.host;
  var pingCommand = new Ansible.AdHoc()
    .inventory(hostPath)
    .hosts('localhost')
    .limit(host)
    .module('hostname')
    .args({
      name: "newName"
    })
    .exec()
    .then(function(result) {
      var responseCode = 200;
      if (result.code !== 0) {
        responseCode = 404;
      }
      var parsedResponse = parseResult(result);
      res
        .status(responseCode)
        .json(parsedResponse);
    }, function(err) {
      console.error('err: ', err);
      res.status(500).json({
        'err': err
      });
    });
});

app.get('/ping', function(req, res) {
  var pingCommand = new Ansible.AdHoc()
    .inventory(hostPath)
    .hosts('voldenuit')
    .module('ping')
    .exec()
    .then(function(result) {
      console.log('/ping - response!');
      console.log(result);
      var responseCode = 200;
      if (result.code !== 0) {
        responseCode = 404;
      }
      var parsedResponse = parseResult(result);
      res
        .status(responseCode)
        .json(parsedResponse);
    }, function(err) {
      console.error('err: ', err);
      res.status(500).json({
        'err': err
      });
    });
});

app.get('/uptime/:name', function(req, res) {
  sshExec('uptime', req.params.name, res, req);
});

app.get('/reset/:name', function(req, res) {
  sshExec('sudo /sbin/reboot -l', req.params.name, res, req);
});

app.get('/rename/:name/:newname', function(req, res) {
  console.log(req.params.name);
  console.log(req.params.newname);
  sshExec("sudo sed -i 's/"+req.params.name+"/"+req.params.newname+"/' /etc/hosts /etc/hostname; sudo reboot", req.params.name+'.'+config.network.extension, res, req);
});

app.get('/resetall', function(req, res) {
  console.log('reboot all');
  var pingCommand = new Ansible.AdHoc()
    .inventory(hostPath)
    .hosts('localhost')
    .module('shell')
    .args('/sbin/reboot -l')
    .asSudo()
    .exec()
    .then(function(result) {
      var responseCode = 200;
      if (result.code !== 0) {
        responseCode = 404;
      }
      var parsedResponse = parseResult(result);
      res
        .status(responseCode)
        .json(parsedResponse);
    }, function(err) {
      console.error('err: ', err);
      res.status(500).json({
        'err': err
      });
    });
});

app.get('/app/:name', function(req, res) {
  var applicationName = req.params.name,
    presence = new Ansible.AdHoc()
    .inventory(hostPath)
    .hosts('localhost')
    .module('shell')
    .args(
      'pgrep -o "' + applicationName + '"'
    )
    .exec()
    .then(function(result) {
      console.log(result.code);
      console.log(result.output);
      var responseCode = 200;
      if (result.code !== 0) {
        responseCode = 404;
      }
      var parsedResponse = parseResult(result, applicationName);
      res
        .status(responseCode)
        .json(parsedResponse);
    }, function(err) {
      console.error('err: ', err);
      res.status(500).json({
        'err': err
      });
    });
});

app.listen(3000);