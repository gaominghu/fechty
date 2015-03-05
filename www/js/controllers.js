angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $ionicModal, Hosts, Camera, lodash) {
  $scope.isUp = function(host) {
    return (host.latency >= 0) ? 'up' : 'down';
  };
  $scope.isUpImg = function(host) {
    return '';
  };
  $scope.deviceConnected = function(host) {
    if (host.camera !== undefined)
      return (host.camera.camera.length > 0) ? 'up' : 'down';
    else
      return 'down';
  };
  $scope.iiStreaming = function(host) {
    if (host.camera !== undefined)
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

  $ionicModal.fromTemplateUrl('/templates/modal-rename.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
    $scope.rename = function(oldName, newName) {
      console.log(oldName);
      console.log(newName);
      $scope.messageModal = 'Renaming...';
      Hosts
        .rename(oldName, newName)
        .success(function(response){
          $scope.messageModal = 'Renamde... wait for reboot';
          $scope.modal.hide();
        })
        .error(function(data, status, headers, config) {
          console.log('Can\'t rename: ', data);
          $scope.messageModal = 'Fail to rename ' + oldName + ' to ' + newName +'. Reason: '+data.err.code;
        });
    };
  });
  $scope.openModal = function() {
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
  });
  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });

    $scope.reboot = function(hostname){
      Hosts
        .reboot(hostname)
        .success(function(response){
          console.log("reboot succeed");
        })
        .error(function(data, status, headers, config) {
          console.log('Can\'t reboot: ', data);
        });
    };
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