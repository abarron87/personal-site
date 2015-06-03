'use strict';

/* Controllers */
app.controller("AutoSuggestController", 
	[
	"$scope",
	"categoriesMapBuilder",
	"autoSuggest",
	function($scope,categoriesMapBuilder,autoSuggest) {
		var self = this;

    	self.rootId = "category_1_container";
    	self.categoriesMap = categoriesMapBuilder.buildCategoriesMap({root: self.rootId});
    	
    	autoSuggest.setCategoryMaps(self.categoriesMap);

    	$scope.suggestions = { empty: true };
    	$scope.selectedCategories = {};

    	$scope.getSuggestions = function(query){
    		$scope.suggestions = autoSuggest.getSuggestions(query);
    	};

    	$scope.toggleSelection = function($event){
    		var categoryId = angular.element($event.target || $event.srcElement).attr("id");

    		$scope.selectedCategories = autoSuggest.addSelectionAndParents(categoryId,$scope);

    		console.log($scope.selectedCategories);
    	};

    	$scope.removeSelection = function(treeElemId,id){
    		var childrenMap = categoriesMapBuilder.buildCategoriesMap({ root: treeElemId });
    		$scope.selectedCategories = autoSuggest.removeSelections(childrenMap, id, $scope);
    		console.log(id);
    	};
	}
	]
);