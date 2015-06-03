// var Jade = require("jade");

Array.prototype.indexOfCategory = function(categoryId){
	for(var i = 0, len = this.length; i < len; i++){
		if(this[i].id === categoryId){
			return i;
		}
	}

	return -1;
};

// Views
TreeCategoriesAutoSuggest.Views.App = Backbone.View.extend({
	id: "superheroesAutoSuggestContainer",

    className: "suggestionsContainer",

	events: {
		"keyup .text": "handleQuery"
	},

	initialize: function(){
		this.startState = true;
        this.categoriesMap = CategoryMapBuilder.buildCategoriesMap({ root: "category_1_container" });
        this.selectedCategories = [];
        this.suggestions = [];
        this.subViews = {};

        // Backbone.Mediator.subscribe("SuggestionsViewUpdated", this.renderSuggestions, this);
        // Backbone.Mediator.subscribe("SelectedCategoriesViewUpdated", this.renderSelectedCategories, this);
        Backbone.Mediator.subscribe("SuggestionSelected", this.addSelectionAndParents, this);
        Backbone.Mediator.subscribe("SelectionRemoved", this.removeSelections, this);

        console.log(jQuery("#autoSuggestTemplate").text().replace(/(\s|\t)+/,''));
        // this.template = Jade.compile(jQuery("#autoSuggestTemplate").text().replace(/(\s|\t)+/,''));

        this.template = _.template(jQuery("#autoSuggestTemplate").html());

        if(!jQuery.isEmptyObject(this.categoriesMap)){
            this.render();
        };

        console.log(this.categoriesMap);
    },

    // template: _.template(jQuery("#autoSuggestTemplate").html()),

    render: function(){
    	jQuery("#superheroesWrapper").append(this.$el.html(this.template()));
    },

    renderSuggestions: function(){
    	var suggestionsContainer = this.$el.find(".taxonomySuggestions"),
 			suggestionsSubView = this.subViews["suggestions"];

    	suggestionsSubView.render();
    	// suggestionsContainer.html(this.subViews["suggestions"].el);
    	(suggestionsSubView.collection.length) ? suggestionsContainer.removeClass("hide") : suggestionsContainer.addClass("hide");
    },

    renderSelectedCategories: function(){
    	var selectedCategoriesContainer = this.$el.find(".selectedCategories"),
    		selectedCategoriesSubView = this.subViews["selectedCategories"];

    	selectedCategoriesSubView.render();
    	// suggestionsContainer.html(this.subViews["suggestions"].el);
    	(selectedCategoriesSubView.collection.length) ? selectedCategoriesContainer.removeClass("hide") : selectedCategoriesContainer.addClass("hide");
    },

    handleQuery: function(e){
    	var query = jQuery(e.target || e.srcElement).val();

    	this.suggestions = this.getSuggestions(query);
    	this.setSuggestions();
    	this.renderSuggestions();
    },

    getSuggestions: function(query){
        this.query = query;

        var suggestions = [];

        if(this.query.length > 2){
            //search for entered text inside categories map. build up suggestions map.
            for(var catId in this.categoriesMap){
                if(this.categoriesMap.hasOwnProperty(catId)){
                    var cat = this.categoriesMap[catId],
                        catName = cat.name;

                    if((~catName.toLowerCase().indexOf(this.query.toLowerCase())) && (!~this.selectedCategories.indexOfCategory(catId))){
                        suggestions.push(new TreeCategoriesAutoSuggest.Models.Category({
                        	id: catId,
                        	name: catName,
                        	parentId: cat.parentId,
                        	path: cat.path
                        }));
                    }
                }
            }
        }

        return suggestions;
    },

    setSuggestions: function(){
    	if(this.startState){
    		this.subViews["suggestions"] = new TreeCategoriesAutoSuggest.Views.Suggestions({
    			collection: new TreeCategoriesAutoSuggest.Collections.Suggestions(this.suggestions)
    		});

    		this.startState = false;
    	}
    	else{
    		this.subViews["suggestions"].collection.reset(this.suggestions);
    	}
    },

    addSelectionAndParents: function(categoryId){
        var category = this.categoriesMap[categoryId],
            selections = [categoryId];

        selections = this.getParentCategories(category,selections);

        for(var i = (selections.length-1); i >= 0; i--){
            this.selectedCategories = this.addSelection(selections[i]);
        }

        this.suggestions = this.getSuggestions(this.query);
        this.setSuggestions();
        this.renderSuggestions();

        this.setSelectedCategories();
        this.renderSelectedCategories();
        console.log(this.selectedCategories);
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

        if(category && (!~this.selectedCategories.indexOfCategory(categoryId))){
            this.selectedCategories.push({
            	id: categoryId,
            	parentId: category.parentId,
            	name: category.name,
            	path: category.path
            });
        }

        return this.selectedCategories;
    },

    removeSelections: function(payload){
        //add the node the user selected to the map that will be removed.
        this.removeSelection(payload.categoryId);

        for(var catId in payload.childrenMap){
            if(payload.childrenMap.hasOwnProperty(catId)){
                this.removeSelection(catId);
            }
        }

        this.setSelectedCategories();
        this.suggestions = this.getSuggestions(this.query);
        this.setSuggestions();
        this.renderSelectedCategories();
        this.renderSuggestions();
    },

    removeSelection: function(categoryId){
    	var categoryIndex = this.selectedCategories.indexOfCategory(categoryId);

        if(~categoryIndex){
            this.selectedCategories.splice(categoryIndex,1);
        }
        else{
        	console.log("Category not present");
        }
    },

    setSelectedCategories: function(){
    	if(!this.subViews.hasOwnProperty("selectedCategories")){
    		this.subViews["selectedCategories"] = new TreeCategoriesAutoSuggest.Views.SelectedCategories({
    			collection: new TreeCategoriesAutoSuggest.Collections.SelectedCategories(this.selectedCategories)
    		});
    	}
    	else{
    		this.subViews["selectedCategories"].collection.reset(this.selectedCategories);
    	}
    }
});

TreeCategoriesAutoSuggest.Views.Suggestion = Backbone.View.extend({
	model: TreeCategoriesAutoSuggest.Models.Category,

	tagName: "li",

	events: {
		"change .checkbox": "handleCheckboxClick"
	},

	initialize: function(){
		this.template = _.template(jQuery("#suggestionTemplate").html());

		this.render();
	},

	render: function(){
		//We can add some data to the template here if needed
		this.$el.html(this.template(this.model.toJSON()));

		return this;
	},

	handleCheckboxClick: function(e){
		var categoryId = jQuery(e.target || e.srcElement).attr("id");

		Backbone.Mediator.publish("SuggestionSelected", categoryId);
	}
});

TreeCategoriesAutoSuggest.Views.SelectedCategory = Backbone.View.extend({
	model: TreeCategoriesAutoSuggest.Models.Category,

	tagName: "li",

	id: "selectedCategory_<%= id %>",

	events: {
		"click .remove": "handleRemoveClick"
	},

	initialize: function(){
		this.template = _.template(jQuery("#selectedCategoryTemplate").html());

		this.render();
	},

	render: function(){
		//We can add some data to the template here if needed
		this.$el.html(this.template(this.model.toJSON()));

		return this;
	},

	handleRemoveClick: function(e){
		var categoryId = jQuery(e.target || e.srcElement).attr("id").match(/selectedCategory_(\d+)/)[1];
		var childrenMap = CategoryMapBuilder.buildCategoriesMap({ root: "category_" + categoryId + "_container" });

		Backbone.Mediator.publish("SelectionRemoved", {
			childrenMap: childrenMap,
			categoryId: categoryId
		});
	}
});


// ================
// Collection Views
// ================
Backbone.CollectionView = Backbone.View.extend({
	subViews: [],

	subViewType: Backbone.View,

	handleReset: function(){
		console.log("reset");
		this.cleanupOldSubViews();
		this.initSubViews();
	},

	initSubViews: function(){
		this.collection.each(function(model){
			this.subViews.push(new this.subViewType({
				model: model
			}));
		},this);
	},

	cleanupOldSubViews: function(){
		_.each(this.subViews,function(subView){
			subView.remove()
		},this);

		this.subViews = [];
	}
});

TreeCategoriesAutoSuggest.Views.Suggestions = Backbone.CollectionView.extend({
	el: ".taxonomySuggestions ul",

	subViewType: TreeCategoriesAutoSuggest.Views.Suggestion,

	initialize: function(){
		this.collection.on("reset",this.handleReset,this);
		this.suggestionViews = [];
		this.initSubViews();
	},

	render: function(){
		_.each(this.subViews,function(suggestionView){
			this.$el.append(suggestionView.render().el);
		},this);

		// Backbone.Mediator.publish("SuggestionsViewUpdated");
	}
});

TreeCategoriesAutoSuggest.Views.SelectedCategories = Backbone.CollectionView.extend({
	el: ".selectedCategories ul",

	subViewType: TreeCategoriesAutoSuggest.Views.SelectedCategory,

	initialize: function(){
		this.collection.on("reset", this.handleReset, this);
		this.selectedCategoryViews = [];
		this.initSubViews();
	},

	render: function(){
		_.each(this.subViews,function(selectedCategoryView){
			this.$el.append(selectedCategoryView.render().el);
		},this);

		// Backbone.Mediator.publish("SelectedCategoriesViewUpdated");
	}
});
