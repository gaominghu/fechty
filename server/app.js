var express = require('express'),
  app = express(),
  path = require('path'),
  Ansible = require('node-ansible'),
  application = [{
    name: 'Photoshop'
  }],
  sshConf = require('./config/user.json'),
  config = require('./config/config.json'),
  hosts = require('./config/hosts.json'),
  //hostPath = path.join(__dirname,'config','hosts');
  hostPath = "/Users/gabrielstuff/Sources/node/fechty/server/config/hosts",
  sshClient = require('ssh2').Client,
  ping = require('jjg-ping'),
  hostNumber = 0;
  workstationList = [],
  Q = require('q'),
  _ = require('lodash');

console.log(hosts);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var init = function() {
  hosts.list.forEach(function(hostValue, index) {
    if (hostValue.type === 'pattern') {
      hostNumber += hostValue.number;
    } else {
      hostNumber++;
    }
  });
  var mdns = require('mdns');
  var workstationService = mdns.createBrowser(mdns.tcp('workstation'));
  workstationService.on('serviceUp', function(service) {
    console.log("service up: ", service);
    if(_.findWhere(workstationList,{basename: service.name}) === undefined){
      workstationList.push({
      name: service.host.replace('.local.', ''),
      address: service.host.replace('local.', 'local'),
      ip: service.addresses[0],
      basename: service.name,
      networkInterface: service.networkInterface
    });
    }
  });
  workstationService.on('serviceDown', function(service) {
    console.log("service down: ", service);
    workstationList = _.remove(workstationList, function(machine) {
     return machine.basename === service.name; 
    });
  });
  workstationService.on('error', function(err) {
    console.log('MDNS - error: ', err);
  })
  workstationService.start();
}

init();

var zeroPad = function(number, length) {
  var my_string = '' + number;
  while (my_string.length < length) {
    my_string = '0' + my_string;
  }
  return my_string;
}

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

var pingpingping = function(domain, req, res) {
  return Q.Promise(function(resolve, reject) {
    ping.system.ping(domain, function(latency, status) {
      if (status) {
        // Host is reachable/up. Latency should have a value.
        console.log(domain + ' is reachable (' + latency + ' ms ping).');
        var data = {
          hostname: domain.replace('.' + config.network.extension, ''),
          address: domain,
          latency: latency
        };
        if (res !== undefined) {
          res
            .status(200)
            .json({
              'data': data,
              error: ''
            });
        }
        resolve(data);
      } else {
        // Host is down. Latency should be 0.
        console.log(domain + ' is unreachable.');
        var data = {
          hostname: domain.replace('.' + config.network.extension, ''),
          address: domain,
          latency: -1
        };
        if (res !== undefined) {
          res
            .status(404)
            .json({
              'err': 'not reachable',
              'data': data
            });
        }
        reject(data);
      }
    });
  });
}

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
      conn.exec(command, {
        pty: true
      }, function(err, stream) {
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
  console.log('call ping');
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
  sshExec('sudo /sbin/reboot', req.params.name, res, req);
});

app.get('/hosts', function(req, res) {
  var hostList = [];
  //Could be optimized, make the list at startup.

  hosts.list.forEach(function(hostValue, index) {
    if (hostValue.type === 'pattern') {
      for (var i = 1; i <= hostValue.number; i++) {
        hostList.push({
          hostname: hostValue.name + zeroPad(i, 2),
          address: hostValue.name + zeroPad(i, 2) + '.' + hostValue.extension
        });
      }
    } else {
      hostList.push({
        hostname: hostValue.name,
        address: hostValue.address
      });
    }
  });
  res
    .status(200)
    .json({
      data: hostList,
      err: ''
    });
});

app.get('/hosts/all', function(req, res) {

});

app.get('/ping/all', function(req, res) {
  var response = [];

  function addData(data) {
    response.push(data);
    if (response.length >= hostNumber) {
      res
        .status(200)
        .json({
          data: response,
          err: ''
        });
    }
  }

  console.log('call ping:' + '/ping/all');
  hosts.list.forEach(function(hostValue, index) {
    //console.log(hostValue);
    if (hostValue.type === 'pattern') {
      for (var i = 1; i <= hostValue.number; i++) {
        //console.log(hostValue.name + zeroPad(i, 2) + '.' + hostValue.extension);
        pingpingping(hostValue.name + zeroPad(i, 2) + '.' + hostValue.extension)
          .then(function(data) {
            console.log('finish: ', data);
            addData(data);
          }, function(err) {
            console.log('err: ', err);
            addData(err);
          }).catch(function(error) {
            console.log('oh no', error);
          });
      }
    } else {
      pingpingping(hostValue.address)
        .then(function(data) {
          console.log('finish: ', data);
          addData(data);
        }, function(err) {
          console.log('err: ', err);
          addData(err);
        }).catch(function(error) {
          console.log('oh no', error);
        });
    }
  });
});


app.get('/ping/:name', function(req, res) {
  console.log('call ping:' + req.params.name);
  pingpingping(req.params.name, req, res)
    .then(function(data) {
      console.log('finish: ', data);
    }, function(err) {
      console.log('err: ', err);
    }).catch(function(error) {
      console.log('oh no', error);
    });
});


app.get('/rename/:name/:newname', function(req, res) {
  console.log(req.params.name);
  console.log(req.params.newname);
  sshExec("sudo sed -i 's/" + req.params.name + "/" + req.params.newname + "/' /etc/hosts /etc/hostname; sudo reboot", req.params.name + '.' + config.network.extension, res, req);
});

app.get('/resetall/:name', function(req, res) {
  console.log('reboot all');
  var pingCommand = new Ansible.AdHoc()
    .inventory(hostPath)
    .hosts(req.params.name)
    .module('shell')
    .args('/sbin/reboot')
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

app.listen(config.port);