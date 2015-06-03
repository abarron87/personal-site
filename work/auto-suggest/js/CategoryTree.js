/*
 Auxiliary code to facilitate the show/hide of the original tree.
 @author Alex Barron
 */
var CategoryTree = (function(){
	var _bindEvents = function(){
			jQuery("#superheroesWrapper").on("click","a",_toggleChildTrees);
		},
		_toggleChildTrees = function(e){
			var target = jQuery(e.target || e.srcElement),
				categoryChildren = target.parent().next();

			if(!target.is("#toggle_tree")){
				if(categoryChildren.children().length > 0){
					categoryChildren.toggleClass("hide");
				}
			}

			e.preventDefault();
		};

	return {
		bindEvents: _bindEvents
	}
})().bindEvents();
