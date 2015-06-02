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


if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
        return this.replace(
            /\{([^{}]*)\}/g,
            function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            }
        );
    };
}


if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
        return this.replace(
            /\{([^{}]*)\}/g,
            function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            }
        );
    };
}

var TreeCategoriesAutoSuggest = function(settings){
    jQuery.extend(this,settings);
    this.initialize();
};

TreeCategoriesAutoSuggest.prototype = {
    suggestionsSourceTemplate: '<!--label>{label}</label--><input id="{inputId}" class="text" type="text" placeholder="Type a superhero\'s name"/>',
    suggestionsContainerTemplate: '<{el} id="{id}Container" class="{containerClasses}"><div class="taxonomySuggestions hide"></div><div class="selectedCategories"><ul></ul></div></{el}>',
    treeConfig: {
        categoryIdRegex: /categoryTree_(\d+)/,
        treeCategorySelector: "categoryTree_categorySelector",
        categoryVarPattern: "categoryTree_",
        categoryCheckboxIdPattern: "chckbx_categoryTree_"
    },
    cachedSuggestionsHtml: "",

    initialize: function() {
        this.cachedUserEntry = "";
        this.selectedCategoriesMap = {};
        this.removedCategoriesMap = {}; //Map to store those that have been removed during current page life.
        this.suggestions = {};

        this.bindUI();
        this.bindEvents();

        this.categoriesMapBuilder = new CategoryMapBuilder({
            containerIdentifier: this.treeConfig.containerIdentifier || "_container",
            categoryIdPattern: this.treeConfig.categoryIdPattern,
            // categoryCheckboxIdPattern: this.treeConfig.categoryCheckboxIdPattern,
            categoryVarPattern: this.treeConfig.categoryVarPattern
        });

        this.cMap = this.categoriesMapBuilder.buildCategoriesMap({ root: this.treeConfig.rootId });

        this.selectedCategoriesMap = this.cMap.selectedCategories;
        this.categoriesMap = this.cMap.categories;

        console.log("All leaves:",this.categoriesMap);
        console.log("Selected:",this.selectedCategoriesMap);
        this.renderSelections();
        this.treeContainer.addClass("hide");
    },

    bindUI: function() {
        this.suggestionsContainer = jQuery(this.suggestionsContainerTemplate.supplant({
            el: this.suggestionsContainerElement || "div",
            containerClasses: this.suggestionsContainerClasses || "suggestionsContainer",
            id: this.suggestionSourceId
        }));
        this.suggestionsSource = jQuery(this.suggestionsSourceTemplate.supplant({
            // label: this.treeContainer.find("label").html(),
            inputId: this.suggestionSourceId
        }));

        this.treeContainer.after(this.suggestionsContainer.prepend(this.suggestionsSource));
    },

    bindEvents: function() {
        this.suggestionsSource.keyup(this.handleSuggestionsSourceActivity.bind(this));
        this.suggestionsContainer.focus(this.handleSuggestionsSourceActivity.bind(this));
        this.suggestionsSource.blur(this.handleBlur.bind(this));
        this.suggestionsContainer.delegate("input[type='checkbox']","click",this.handleCheckboxClick.bind(this));
        this.suggestionsContainer.delegate("a.remove","click",this.handleRemoveClick.bind(this));
    },

    handleSuggestionsSourceActivity: function(e){
        this.getSuggestions(null,jQuery(e.target || e.srcElement));
    },

    /*
     Search through categories map built in buildCategoriesMap and generate suggestions.
     */
    getSuggestions: function(specialCase,target){
        var target = target || this.suggestionsContainer.children("#"+this.suggestionSourceId),
            targetVal = target.val(),
            suggestionsHtml = "";

        if(targetVal.length > 2){
            //if entered value is different to last one that generated suggestions.
            if((this.cachedUserEntry !== targetVal) || specialCase) {
                var suggestionTemplate = '<li><input id="{categoryId}" class="checkbox" type="checkbox"/><span>{suggestion} ({path})</span></li>';

                this.suggestions = {}; //New text entered so clear suggestions.

                //search for entered text inside categories map. build up suggestions map.
                for(var catId in this.categoriesMap){
                    if(this.categoriesMap.hasOwnProperty(catId)){
                        var catName = this.categoriesMap[catId].name;

                        console.log(catId);
                        if((~catName.toLowerCase().indexOf(targetVal.toLowerCase())) && (!this.selectedCategoriesMap.hasOwnProperty(catId))){
                            this.suggestions[catId] = this.categoriesMap[catId];
                        }
                    }
                }

                //if suggestions have been found, create markup and render.
                if(!jQuery.isEmptyObject(this.suggestions)){
                    suggestionsHtml += "<ul>";

                    for(var catId in this.suggestions){
                        if(this.suggestions.hasOwnProperty(catId)){
                            var suggestion = this.suggestions[catId];
                            suggestionsHtml += suggestionTemplate.supplant({
                                categoryId: catId,
                                suggestion: suggestion.name,
                                path: suggestion.path + "/" + suggestion.name
                            });
                        }
                    }

                    suggestionsHtml += "</ul>";

                    this.showSuggestions(suggestionsHtml);

                    //cache latest suggestions. if next entry is the same, we can just show these again.
                    //e.g. user clicks out and then focuses again on the box.
                    this.cachedSuggestionsHtml = suggestionsHtml;
                }
                else{
                    //search did not find any matches.
                    this.hideSuggestions();
                    this.cachedSuggestionsHtml = "";
                }
            }
            else if(this.cachedSuggestionsHtml !== ""){
                //if value is the same as the previous entry
                this.showSuggestions(this.cachedSuggestionsHtml);
            }
        }
        else{
            //if box is less than 3 characters the suggestions.
            this.hideSuggestions();
        }

        //cache current value. when entering more or less text, generate more suggestions.
        this.cachedUserEntry = targetVal;
    },

    showSuggestions: function(html){
        var suggestionsListContainer = this.suggestionsContainer.children(".taxonomySuggestions");

        if(html){
            suggestionsListContainer.html(html);
        }

        suggestionsListContainer.removeClass("hide");
    },

    hideSuggestions: function(e){
        this.suggestionsContainer.children(".taxonomySuggestions").html("").addClass("hide");
    },

    handleCheckboxClick: function(e){
        var target = jQuery(e.target || e.srcElement);

        if(target.is(":checkbox")){
            var categoryId = target.attr("id");

            this.addSelectionAndParents(categoryId);
        }
    },

    /*
     When selecting a category, add its parents to the selections. This will also
     remove the parents from suggestions.
     */
    addSelectionAndParents: function(categoryId){
        var category = this.categoriesMap[categoryId],
            selections = [categoryId];

        selections = this.getParentCategories(category,selections);

        for(var i = (selections.length-1); i >= 0; i--){
            this.addSelection(selections[i]);
        }
    },

    removeSelectionAndChildren: function(categoryId){
        var childrenMap = this.categoriesMapBuilder.buildCategoriesMap({ root: this.treeConfig.categoryVarPattern+categoryId+this.treeConfig.containerIdentifier }).categories;

        //add the node the user selected to the map that will be removed.
        childrenMap[categoryId] = this.selectedCategoriesMap[categoryId];

        //remove from selected map and from DOM.
        this.removeSelections(childrenMap);

        this.getSuggestions(true);
    },

    /*
     Remove selections from list of selected categories, and in turn remove them from the DOM.
     */
    removeSelections: function(map){
        for(var catId in map){
            if(map.hasOwnProperty(catId)){
                this.removeSelection(catId);
                this.renderSelection(catId);
            }
        }
    },

    /*
     Recursive method to grab parent categories. Stops at root.
     */
    getParentCategories: function(category,selections){
        if(this.categoriesMap.hasOwnProperty(category.parentId)){
            selections.push(category.parentId);
            selections = this.getParentCategories(this.categoriesMap[category.parentId],selections);
        }

        return selections;
    },

    /*
     Add new selection from auto suggest and render it.
     */
    addSelection: function(categoryId){
        var category = this.categoriesMap[categoryId];

        if(category && (!this.selectedCategoriesMap.hasOwnProperty(categoryId))){
            this.selectedCategoriesMap[categoryId] = category;
            this.getSuggestions(true);
            this.renderSelection(categoryId);
        }
    },

    /*
     Remove selection. Add to map of unselected categories. Remove from map of selected categories.
     */
    removeSelection: function(categoryId){
        if(this.selectedCategoriesMap.hasOwnProperty(categoryId)){
            if(!this.removedCategoriesMap.hasOwnProperty(categoryId)){
                this.removedCategoriesMap[categoryId] = this.selectedCategoriesMap[categoryId];
            }

            delete this.selectedCategoriesMap[categoryId];
            this.renderSelection(categoryId);
        }
    },

    /*
     Render category selected from auto suggest or remove one.
     */
    renderSelection: function(categoryId){
        var selectedCategoriesContainer = this.suggestionsContainer.children(".selectedCategories");

        if(!this.selectedCategoriesMap.hasOwnProperty(categoryId)){
            selectedCategoriesContainer.find("li[id='selectedCategory_"+categoryId+"']").remove();
        }
        else{
            var selectedCategory = this.selectedCategoriesMap[categoryId],
                newSelection = '<li id="selectedCategory_{categoryId}">{categoryName} ({path}) <a href="#" class="remove">[{removeText}]</a></li>'.supplant({
                    categoryId: categoryId,
                    categoryName: selectedCategory.name,
                    path: selectedCategory.path + "/" + selectedCategory.name,
                    removeText: "remove"
                });

            selectedCategoriesContainer.children("ul").append(newSelection);
        }
    },

    renderSelections: function(map){
        var isSelectedCategories = !jQuery.isEmptyObject(this.selectedCategoriesMap);

        if(isSelectedCategories){
            for(var cat in this.selectedCategoriesMap){
                if(this.selectedCategoriesMap.hasOwnProperty(cat)){
                    this.renderSelection(cat);
                }
            }
        }
    },

    handleBlur: function(e){
        var target = jQuery(e.target || e.srcElement);

        if(target.val() === ""){
            this.hideSuggestions();
        }
    },

    handleRemoveClick: function(e){
        var target = jQuery(e.target || e.srcElement),
            categoryId = target.parent().attr("id").match(/^selectedCategory_(\d+)$/)[1];

        if(target.hasClass("remove")){
            this.removeSelectionAndChildren(categoryId);
        }

        e.preventDefault();
    }
};
