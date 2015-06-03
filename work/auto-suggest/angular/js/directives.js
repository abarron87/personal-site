'use strict';

/* Directives */

app.directive("superheroes", [function() {
    return {
        restrict: "E",
        // scope: {
        //     buildMap: "&"
        // },
        replace:true,
        templateUrl: "superheroes.html",
        controller: "AutoSuggestController"
    };
}]);

//angular.module('myApp.directives', []).
//directive('appVersion', ['version', function(version) {
//    return function(scope, elm, attrs) {
//        elm.text(version);
//    };
//}]);
