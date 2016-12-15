describe('MainController', function() {
  beforeEach(module('flapperNews'));

  var $controller;

  beforeEach(inject(function(_$controller_){
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $controller = _$controller_;
  }));

    describe('addPost', function(){
      it('add a post', function(){
        var $scope = {};
        var posts = {};
        var auth = {};
        var $scope.title = "just a testing title to try";
        var $scope.link = "www.justatest.com";
        var controller = $controller('MainCtrl', { $scope : $scope, $posts : $posts, $auth : $auth});
        $scope.addPost();
        expect($scope.posts.length).toEqual(1);
      })
    })

  });
});
