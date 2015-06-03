/*
    CategoryMapBuilder is a component that traverses category trees.
    @author Alex Barron
*/
var CategoryMapBuilder = function(settings){
    jQuery.extend(this,settings);
    this.categoryIdRegex = new RegExp(this.categoryIdPattern);
    this.categoryMaps = settings.categoryMaps || {
        categories: {},
        selectedCategories: {}
    };
};

CategoryMapBuilder.prototype = {
    /*
        From a given root node (denoted by its string id) recurse through its children
        and build up a map of categories, storing the path to the node, the name and the parent node ID (for removing).
        @param settings - a map of settings:
            {
                root - the String DOM id of the element you wish to traverse down from. Should be a div that contains child category nodes.
                count - count of nodes traversed in case you wish to track this.
                currentPath - starts at the root and will subsequently be passed in as in for the relevant level in the tree.
            }
        @return map containing 2 maps. The first is all categories under the root node. The second is
        of already selected categories (minus the root node).
    */
    buildCategoriesMap: function(settings){
        var root = document.getElementById(settings.root),
            children = root.children,
            categoryMaps = settings.categoryMaps || {
                categories: {},
                selectedCategories: {}
            },
            count = settings.count || 0,
            currentPath = settings.currentPath || "/"+this.getPreviousSibling(root).getElementsByTagName("a")[0].innerHTML;

        //Iterate over root's children.
        for(var i = 0, len = children.length; i < len; i++){
            var child = children[i],
                childId = child.getAttribute("id");

            if(child.tagName.toLowerCase() === "div"){
                //Only the divs with "-cont" at the end should be inspected. There are siblings that contain
                //the checkbox and anchor and label etc. We just care about the container of children.
                if(childId && ~childId.indexOf(this.containerIdentifier)){
                    var categoryDiv = this.getPreviousSibling(child),
                        categoryName = categoryDiv.getElementsByTagName("a")[0].innerHTML,
                        childIdNum = childId.match(this.categoryIdRegex)[1],
                        parentId = child.parentNode.getAttribute("id").match(this.categoryIdRegex)[1];
                   
                    count++;

                    //use category id for object key.
                    categoryMaps.categories[childIdNum] = {
                        parentId: parentId,
                        name: categoryName,
                        path: currentPath
                    };

                    // Populate a map of categories already saved. This map will be used
                    // by TaxonomyAutoSuggest to render a list of selected categories.
                    // if(child.children.length === 0){
                        if(categoryDiv.getElementsByTagName("input")[0].checked){
                            categoryMaps.selectedCategories[childIdNum] = {
                                parentId: parentId,
                                name: categoryName,
                                path: currentPath
                            };
                        };
                    // }

                    // Call itself using the child as the root node.
                    this.categoryMaps = this.buildCategoriesMap({
                        root: childId,
                        categoryMaps: categoryMaps,
                        count: count,
                        currentPath: currentPath + "/" + categoryName
                    });
                }
            }
        }

        return categoryMaps;
    },

    getPreviousSibling: function(root){
    	var previousSibling = root.previousSibling;

    	if(previousSibling.nodeType !== 1){
			return this.getPreviousSibling(previousSibling);
		}

		return previousSibling;
    },

    /*
        Iterate over a map of categories and call method to check if parents need to be deselected (if none of its children
        are selected).
        @param map - Map of categories that have been unselected from the TaxonomyAutoSuggest and that should be
        removed from the taxonomy tree.
    */
    removeCategories: function(map){
        for(var cat in map){
            if(map.hasOwnProperty(cat)){
                var cetTreeCheckbox = jQuery("#"+this.categoryCheckboxIdPattern+cat);

                //Should always be checked but just make sure.
                if(cetTreeCheckbox.prop("checked")){
                    // triggering actual DOM element - rather than jQuery object - triggers the parent's click also. Not sure why doesn't work with jQuery.
                    cetTreeCheckbox[0].click();

                    // Using reference to parent node in categories map check if any siblings are ticked. If all are unticked, untick parent.
                    this.testAndRemove(document.getElementById(this.categoryVarPattern+this.categoryMaps.categories[cat].parentId+this.containerIdentifier));
                }                    
            }
        }
    },

    /*
        From a given root element check children to see if any are ticked.
        If no children are ticked, untick it. Recurse up to the next parent.
    */
    testAndRemove: function(root){
        var categoryId = root.getAttribute("id"),
            categoryIdNum = (categoryId === "root-cont") ? false : categoryId.match(this.categoryIdRegex)[1];

        //Go up only as far as root element.
        if(categoryIdNum){
            var treeCheckboxParent = document.getElementById(this.categoryCheckboxIdPattern+categoryIdNum),
                siblings = root.children,
                siblingCount = siblings.length,
                count = 0;

            for(var i = 0; i < siblingCount; i++){
                var sibling = siblings[i],
                    siblingId = sibling.getAttribute("id");

                if(~siblingId.indexOf(this.containerIdentifier)){
                    var siblingIdNum = siblingId.match(this.categoryIdRegex)[1];
                    
                    if(!document.getElementById(this.categoryCheckboxIdPattern+siblingIdNum).checked){
                        count++;
                    }
                }
            }

            //there are 2 divs (siblings) for each category (one for the checkbox and one that contains children, if any.)
            if(count === (siblingCount/2)){
                treeCheckboxParent.click();

                //call itself on the next parent.
                this.testAndRemove(document.getElementById(this.categoryVarPattern+categoryIdNum).parentNode);
            }
        }
    }
};