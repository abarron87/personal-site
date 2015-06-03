'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
app.factory("categoriesMapBuilder", function(){
    return {
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
});

app.factory("autoSuggest", function(){
    return {
        setCategoryMaps: function(categoriesMap){
            this.categoriesMap = categoriesMap;
            this.selectedCategoriesMap = {};
        },

        getSuggestions: function(query,specialCase){
            console.log("query ", query);
            this.query = query;

            var suggestions = { empty: true };

            if(this.query.length > 2){                
                //search for entered text inside categories map. build up suggestions map.
                for(var catId in this.categoriesMap){
                    if(this.categoriesMap.hasOwnProperty(catId)){
                        var catName = this.categoriesMap[catId].name;

                        console.log(catId);
                        if((~catName.toLowerCase().indexOf(this.query.toLowerCase())) && (!this.selectedCategoriesMap.hasOwnProperty(catId))){
                            suggestions = (suggestions.empty) ? {} : suggestions;
                            suggestions[catId] = this.categoriesMap[catId];
                        }
                    }
                }
            }

            return suggestions;

            // //cache current value. when entering more or less text, generate more suggestions.
            // this.cachedUserEntry = query;
        },

        addSelectionAndParents: function(categoryId,scope){
            var category = this.categoriesMap[categoryId],
                selections = [categoryId];

            selections = this.getParentCategories(category,selections);
            
            for(var i = (selections.length-1); i >= 0; i--){
                this.selectedCategoriesMap = this.addSelection(selections[i],scope);
            }

            scope.suggestions = this.getSuggestions(this.query);
            return this.selectedCategoriesMap;
        },

        getParentCategories: function(category,selections){
            if(this.categoriesMap.hasOwnProperty(category.parentId)){
                selections.push(category.parentId);
                selections = this.getParentCategories(this.categoriesMap[category.parentId],selections);
            }

            return selections;
        },

        addSelection: function(categoryId){
            var category = this.categoriesMap[categoryId];

            if(category && (!this.selectedCategoriesMap.hasOwnProperty(categoryId))){
                this.selectedCategoriesMap[categoryId] = category;
            }

            return this.selectedCategoriesMap;
        },

        removeSelections: function(childrenMap,categoryId,scope){
            //add the node the user selected to the map that will be removed.
            this.removeSelection(categoryId);
            
            for(var catId in childrenMap){
                if(childrenMap.hasOwnProperty(catId)){
                    this.removeSelection(catId);
                }
            }

            scope.suggestions = this.getSuggestions(this.query);
            return this.selectedCategoriesMap;
        },

        removeSelection: function(categoryId){
            if(this.selectedCategoriesMap.hasOwnProperty(categoryId)){
                delete this.selectedCategoriesMap[categoryId];
            }
        }
    }
});