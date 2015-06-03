CategoryMapBuilder = {
    getPreviousSibling: function(root){
        var previousSibling = root.previousSibling;

        if(previousSibling.nodeType !== 1){
            return this.getPreviousSibling(previousSibling);
        }

        return previousSibling;
    },

    buildCategoriesMap: function(settings){
        var root = document.getElementById(settings.root),
            children = root.children,
            categoriesMap = settings.categoriesMap || {},
            count = settings.count || 0,
            containerIdentifier = settings.containerIdentifier || "_container",
            currentPath = settings.currentPath || "/"+ this.getPreviousSibling(root).getElementsByTagName("a")[0].innerHTML;

        //Iterate over root's children.
        for(var i = 0, len = children.length; i < len; i++){
            var child = children[i],
                childId = child.getAttribute("id");

            if(child.tagName.toLowerCase() === "div"){
                //Only the divs with "-cont" at the end should be inspected. There are siblings that contain
                //the checkbox and anchor and label etc. We just care about the container of children.
                if(childId && ~childId.indexOf(containerIdentifier)){
                    var categoryDiv = this.getPreviousSibling(child),
                        categoryName = categoryDiv.getElementsByTagName("a")[0].innerHTML,
                        childIdNum = childId.match(/category_(\d+)/)[1],
                        parentId = child.parentNode.getAttribute("id").match(/category_(\d+)/)[1];

                    count++;

                    //use category id for object key.
                    categoriesMap[childIdNum] = {
                        parentId: parentId,
                        name: categoryName,
                        path: currentPath
                    };

                    // Populate a map of categories already saved. This map will be used
                    // by TaxonomyAutoSuggest to render a list of selected categories.
                    // if(child.children.length === 0){
                    //                            if(categoryDiv.getElementsByTagName("input")[0].checked){
                    //                                categoryMaps.selectedCategories[childIdNum] = {
                    //                                    parentId: parentId,
                    //                                    name: categoryName,
                    //                                    path: currentPath
                    //                                };
                    //                            };
                    // }

                    // Call itself using the child as the root node.
                    categoriesMap = this.buildCategoriesMap({
                        root: childId,
                        categoriesMap: categoriesMap,
                        count: count,
                        currentPath: currentPath + "/" + categoryName
                    });
                }
            }
        }

        return categoriesMap;
    }
}