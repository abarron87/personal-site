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
    suggestionsSourceTemplate: '<!--label>{label}</label--><input id="{inputId}" class="text" type="text" placeholder="Type a superheros name e.g. Batman..."/>',
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