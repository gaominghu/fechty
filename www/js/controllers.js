angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $ionicModal, Hosts, Camera, lodash) {
  $scope.isUp = function(host) {
    return (host.latency >= 0) ? 'up' : 'down';
  };
  $scope.isUpImg = function(host) {
    return '';
  };
  $scope.deviceConnected = function(host) {
    if(host.camera !== undefined)
      return (host.camera.camera.length > 0) ? 'up' : 'down';
    else
      return 'down';
  };
  $scope.iiStreaming = function(host) {
    if(host.camera !== undefined)
      return (host.camera.isStreaming) ? 'up' : 'down';
    else
      return 'down';
  };

  Hosts.all().success(function(response) {
      console.log(response.data);
      $scope.hosts = response.data;
      Hosts
        .pingAll()
        .success(function(response) {
          function mergeByProperty(arr1, arr2, prop) {
            lodash.each(arr2, function(arr2obj) {
              var arr1obj = lodash.find(arr1, function(arr1obj) {
                return arr1obj[prop] === arr2obj[prop];
              });
              //If the object already exist extend it with the new values from arr2, otherwise just add the new object to arr1
              arr1obj ? lodash.extend(arr1obj, arr2obj) : arr1.push(arr2obj);
            });
          }

          mergeByProperty($scope.hosts, response.data, 'hostname');
          //console.log(lodash.merge($scope.hosts, response.data));
          console.log($scope.hosts);
          lodash.each($scope.hosts, function(host, index) {
            if (host.latency >= 0) {
              Camera
                .status(host.address)
                .success(function(response) {
                  $scope.hosts[index].camera = response;
                })
                .error(function(data, status, headers, config) {
                  console.log('Can\'t get status for:', host.address);
                });
            }
          });
        })
        .error(function(data, status, headers, config) {
          console.log('error ping all');
        });
    })
    .error(function(data, status, headers, config) {
      console.log('error');
      $scope.hosts = {};
    });

    

})

.controller('ChatsCtrl', function($scope, Chats) {
  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  }
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('FriendsCtrl', function($scope, Friends) {
  $scope.friends = Friends.all();
})

.controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
  $scope.friend = Friends.get($stateParams.friendId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});