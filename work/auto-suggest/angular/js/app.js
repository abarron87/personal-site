'use strict';


// Declare app level module which depends on filters, and services


var app = angular.module("treeApp", [])
    .config(['$interpolateProvider', function($interpolateProvider) {
        $interpolateProvider.startSymbol('[[');
        $interpolateProvider.endSymbol(']]');
    }]);
