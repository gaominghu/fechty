angular.module('starter.services', [])


.factory('Hosts', function($http) {
  var hosts = [];
  return {
    all: function() {
      return $http.get(appURL+'/hosts');
    },
    pingAll: function($scope) {
      return $http.get(appURL+'/ping/all');
    },
    rename: function(oldname, newname){
      return $http.get(appURL+'/rename/'+oldname+'/'+newname);
    },
    reboot: function(hostname){
      return $http.get(appURL+'/reset/'+hostname);
    },
    rebootAll: function(hostname){
      return $http.get(appURL+'/resetall');
    }

  }
})
.factory('Camera', function($http) {
  return {
    status: function(cameraAddress) {
      return $http.get('//'+cameraAddress+':'+zahoPort+'/api/status');
    }
  };
})

.directive('ngConfirmClick', [
  function(){
    return {
      link: function (scope, element, attr) {
        var msg = attr.ngConfirmClick || "Are you sure?";
        var clickAction = attr.confirmedClick;
        element.bind('click',function (event) {
          if ( window.confirm(msg) ) {
            scope.$eval(clickAction)
          }
        });
      }
    };
  }]);