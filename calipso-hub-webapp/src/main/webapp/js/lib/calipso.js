/*
 * Copyright (c) 2007 - 2014 www.Abiss.gr
 *
 * This file is part of Calipso, a software platform by www.Abiss.gr.
 *
 * Calipso is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Calipso is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Calipso. If not, see http://www.gnu.org/licenses/agpl.html
 */

define(function(require) {

	// Baseline setup
	// --------------

	// Establish the root object, `window` in the browser, or `global` on the server.
	var root = this;
	// plumbing for handlebars template helpers 
	Marionette.ItemView.prototype.mixinTemplateHelpers = function(target) {
		var self = this;
		var templateHelpers = Marionette.getOption(self, "templateHelpers");
		var result = {};

		target = target || {};

		if (_.isFunction(templateHelpers)) {
			templateHelpers = templateHelpers.call(self);
		}

		// This _.each block is what we're adding
		_.each(templateHelpers, function(helper, index) {
			if (_.isFunction(helper)) {
				result[index] = helper.call(self);
			} else {
				result[index] = helper;
			}
		});

		return _.extend(target, result);
	};

	// Define and export the Calipso namespace
	var Calipso = {
		util : {},
		components : {},
		collection : {},
		model : {},
		view : {},
		controller : {}
	};

	// Get the DOM manipulator for later use
	Calipso.$ = Backbone.$;

	// //////////////////////////////////////
	// Region
	// //////////////////////////////////////
	Calipso.view.ModalRegion = Marionette.Region.extend({
		el : "#calipsoRegionModal",

		onShow : function(view) {
			view.on("close", this.hideModal, this);
			this.$el.modal('show');
		},

		hideModal : function() {
			this.$el.modal('hide');
		}
	});

	// //////////////////////////////////////
	// Collection
	// //////////////////////////////////////
	Calipso.collection.GenericCollection = Backbone.PageableCollection.extend({
		mode : "server",
		initialize : function(attributes, options) {
			if (options.model) {
				this.model = options.model.searchModel ? options.model.searchModel : options.model;
				this.modelClass = this.model;
			}

			// use given grid columns if provided, or the
			// default model columns otherwise
			if (options.schemaForGrid) {
				this.schemaForGrid = options.schemaForGrid;
			}
			if (options.data) {
				if (options.data[""] || options.data[""] == null) {
					delete options.data[""];
					console.log("GenericCollection#initialize, deletted empty key in given .data, source: " + options.data.toSource());
				}
				this.data = options.data;
			}
			if (options.url) {
				this.url = options.url;
			}
		},
		// Initial pagination states
		state : {
			firstPage : 1,
			currentPage : 1,
			pageSize : 10,
		},
		getGridSchema : function() {
			// use explicit configuration if available
			var configuredSchema = this.schemaForGrid;
			// try obtaining the grid schema from the model otherwise
			if (!configuredSchema && this.model && this.model.prototype.getGridSchema) {
				configuredSchema = this.model.prototype.getGridSchema();
			}

			// ensure proper configuration is available
			if (!configuredSchema) {
				throw "A grid schema has not been given and the collection model does not offer one or is undefined";
			}
			return configuredSchema;
		},
		getPathFragment : function() {
			return this.prototype.getPathFragment();
		},
		// You can remap the query parameters from `state keys from
		// the default to those your server supports
		queryParams : {
			currentPage : "page",
			pageSize : "size",
			totalPages : "totalPages",
			totalRecords : "totalElements",
			sortKey : "properties",
			direction : "order"
		},
		/*
		 * totalElements: 32 lastPage false totalPages 4 numberOfElements 10
		 * firstPage true sort [Object { direction="DESC", property="id",
		 * ascending=false}] number 0 size 10
		 */
		//		
		// parseState: function (resp, queryParams, state, options) {
		// return {
		// totalRecords: resp.totalElements
		// };
		// },
		// //
		// parseRecords: function (resp, options) {
		// return resp.content ;
		// },
		// Parse the JSON response and get the total number of
		// elements.
		// Return only the content JSON element, that contains
		// the users.
		// These are necessary for paging to work.
		// parse : function(resp) {
		// this.total = resp.totalElements;
		// this.totalPages = resp.totalPages;
		// return resp.content;
		// }
		parse : function(response) {
			// console.log("GenericCollection#parse, model:
			// "+this.model.toSource()+", className:
			// "+this.model.getTypeName());
			_self = this;
			this.total = response.totalElements;
			this.totalPages = response.totalPages;
			superModelAwareInstances = [];
			// console.log("GenericCollection#parse, items:
			// "+response.content.length);
			var modelItem;
			var superModelAwareInstance;
			for (var i = 0; i < response.content.length; i++) {
				modelItem = response.content[i];
				if (modelItem) {
					// make Backbone Supermodel aware of this item
					// console.log("GenericCollection#parse model:
					// "+modelItem.id);
					superModelAwareInstance = _self.model.create(modelItem);
					superModelAwareInstance.collection = _self;
					// add to results
					// console.log("GenericCollection#parse adding:
					// "+superModelAwareInstance.get("id"));
					superModelAwareInstances.push(superModelAwareInstance);
				}
			}
			// _.each(response.content, function(modelItem) {});
			return superModelAwareInstances;
		}

	});

	// //////////////////////////////////////
	// Controller
	// //////////////////////////////////////

	Calipso.controller.AbstractController = Marionette.Controller.extend({
		constructor : function(options) {
			console.log("AbstractController#constructor");
			Marionette.Controller.prototype.constructor.call(this, options);
			this.layout = new Calipso.view.AppLayoutView({
				model : Calipso.session
			});
			Calipso.vent.trigger('app:show', this.layout);

		},
		home : function() {
			console.log("AbstractController#home");
			if (!session.isAuthenticated()) {
				Backbone.history.navigate("client/login", {
					trigger : true
				});
				return false;
			}
			this.layout.contentRegion.show(new HomeLayout());
		},

		login : function() {
			var loginModel = new Calipso.model.UserModel({
				email : session.get('email'),
				issuer : session.get('issuer'),

				getLayoutViewType : function() {
					return Calipso.view.ModelDrivenBrowseLayout;
				},
			});

			var view = new Calipso.view.LoginView({
				model : loginModel
			});

			view.on('app:login', this.authenticate);
			console.log("AbstractController#login, showing login view");
			Calipso.vent.trigger('app:show', view);
		},

		authenticate : function(args) {
			// console.log('MainController authenticate called');
			var self = this;
			var email = this.$('input[name="email"]').val();
			var password = this.$('input[name="password"]').val();

			$.when(this.model.authenticate(email, password)).then(function(model, response, options) {
				session.save(model);
				session.load();
				// console.log('MainController authenticate navigating to home');
				Backbone.history.navigate(Calipso.contextPath + "client/home", {
					trigger : true
				});
			}, function(model, xhr, options) {
				self.$el.find('.alert').show();
			});
		},

		logout : function() {
			session.destroy();
			// this.login();
			window.parent.close();
		},
		notFoundRoute : function(path) {
			// console.log("notFoundRoute, path: "+path);
			this.layout.contentRegion.show(new Calipso.view.NotFoundView());
		},
		/**
		 * Get a model representing the current request.
		 * 
		 * For an example, consider the URL [api-root]/users/[some-id]. First,
		 * a model class is loaded based on the URL fragment representing the
		 * type, e.g. "users" for UserModel.
		 * 
		 * A model instance is then created using some-id if provided or
		 * "search" otherwise. If a backbone supermodel instance is already
		 * cached, it is reused.
		 * 
		 * In case of "search" a collection of the given model type is
		 * initialized but, similarly to the model instance, it is not fetched
		 * from the server.
		 * 
		 * @param {string}
		 *           modelTypeKey the URL fragment representing the model type
		 *           key, e.g. "users" for UserModel
		 * @param {string}
		 *           modelId the model identifier. The identifier may be either
		 *           a primary or business key, depending on your server side
		 *           implementation. The default property name in client side
		 *           models is "name". You can override
		 *           {@linkcode GenericModel.prototype.getBusinessKey} to
		 *           define another property name.
		 * @see (@link GenericModel.prototype.getBusinessKey}
		 */
		getModelForRoute : function(modelTypeKey, modelId, httpParams) {
			console.log("AbstractController#getModelForRoute, modelTypeKey: " + modelTypeKey + ", modelId: " + modelId + ", httpParams: " + httpParams);
			var ModelType;
			if (Calipso.modelTypesMap[modelTypeKey]) {
				ModelType = Calipso.modelTypesMap[modelTypeKey];
			} else {
				var modelForRoute;
				var modelModuleId = "model/" + _.singularize(modelTypeKey);
				if (!require.defined(modelModuleId)) {

					require([ modelModuleId ], function(module) {
						ModelType = module;
					})
				}
				//					else{
				ModelType = require(modelModuleId)
				//					}

			}
			if (!ModelType) {
				throw "No matching model type was found for key: " + modelModuleId;
			}
			console.log("AbstractController#getModelForRoute, modelModuleId:" + modelModuleId);

			if (modelId) {
				console.log("AbstractController#getModelForRoute, looking for model id:" + modelId + ", type:" + ModelType.prototype.getTypeName());
				// try cached models first
				modelForRoute = new ModelType({
					id : modelId
				});// ModelType.all().get(modelId);
				// otherwise create a transient instance and let the view load it
				// from the server
				if (!modelForRoute) {
					console.log("AbstractController#getModelForRoute, model for id is not loaded, creating new");
					modelForRoute = ModelType.create({
						id : modelId,
						url : session.getBaseUrl() + "/api/rest/" + modelModuleId + "/" + modelId
					});
					// modelForRoute.fetch({
					// url : session.getBaseUrl() + "/api/rest/" + modelTypeKey + "/" + modelId
					// });
				}
			} else {
				// create a model to use as a wrapper for a collection of
				// instances of the same type
				modelForRoute = ModelType.create("search");
			}
			var collectionOptions = {
				model : ModelType,
				url : Calipso.session.getBaseUrl() + "/api/rest/" + modelForRoute.getPathFragment()
			};
			if (httpParams) {
				if (httpParams[""] || httpParams[""] == null) {
					delete httpParams[""];
					console.log("AbstractController#getModelForRoute, deletted empty key in given .data, source: " + httpParams.toSource());
				}
				collectionOptions.data = httpParams;
			}
			modelForRoute.wrappedCollection = new Calipso.collection.GenericCollection([], collectionOptions);
			console.log("AbstractController#getModelForRoute, model type: " + modelForRoute.getTypeName() + ", id: " + modelForRoute.get("id") + ", collection URL: " + Calipso.session.getBaseUrl() + "/api/rest/" + modelForRoute.getPathFragment());
			return modelForRoute;

		},
		mainNavigationSearchRoute : function(mainRoutePart, queryString) {
			console.log("AbstractController#mainNavigationSearchRoute, mainRoutePart: " + mainRoutePart + ", queryString: " + queryString);
			for (var i = 0, j = arguments.length; i < j; i++) {
				console.log("AbstractController#mainNavigationSearchRoute, argument: " + (arguments[i] + ' '));
			}
			var httpParams = this.getHttpUrlParams(window.location.search);
			this.mainNavigationCrudRoute(mainRoutePart, null, httpParams);

		},
		mainNavigationCrudRoute : function(mainRoutePart, modelId, httpParams) {
			// build the model instancde representing the current request
			console.log("AbstractController#mainNavigationCrudRoute, mainRoutePart: " + mainRoutePart + ", modelId: " + modelId);
			var modelForRoute = this.getModelForRoute(mainRoutePart, modelId, httpParams);

			// get the layout type corresponding to the requested model
			var RequestedModelLayoutType = modelForRoute.getLayoutViewType();

			// show the layout
			// TODO: reuse layout if of the same type
			var routeLayout = new RequestedModelLayoutType({
				model : modelForRoute
			});
			Calipso.vent.trigger("app:show", routeLayout);

			// update page header tabs etc.
			this.syncMainNavigationState(modelForRoute);

		},
		notFoundRoute : function() {
			// build the model instancde representing the current request
			console.log("AbstractController#notFoundRoute");
			Calipso.vent.trigger("app:show", new Calipso.view.NotFoundView());

		},
		decodeParam : function(s) {
			return decodeURIComponent(s.replace(/\+/g, " "));
		},
		getHttpUrlParams : function(url) {
			var urlParams = {};
			var queryString = url.substring(url.indexOf("?") + 1);
			var keyValuePairs = queryString.split('&');
			for ( var i in keyValuePairs) {
				var keyValuePair = keyValuePairs[i].split('=');
				urlParams[this.decodeParam(keyValuePair[0])] = (keyValuePair.length > 1) ? this.decodeParam(keyValuePair[1]) : null;
			}
			return urlParams;
		},
		/*
		 * TODO
		 * 
		 * initCrudLayout : function(routeHelper){ if((!this.layout) ||
		 * this.layout.getTypeName() != "AppLayoutView"){ //
		 * console.log("AbstractController#initCrudLayout, calling
		 * this.ensureActiveLayout()"); this.ensureActiveLayout(); } else{ //
		 * console.log("AbstractController#initCrudLayout, not updating
		 * this.layout: "+this.layout.getTypeName()); } var _self = this;
		 * 
		 * var TabModel = Backbone.Model.extend(); var TabCollection =
		 * Backbone.Collection.extend({ model: GenericModel, initialize:
		 * function () { // console.log("AbstractController#initCrudLayout,
		 * TabCollection initializing"); this.bind('add', this.onModelAdded,
		 * this); this.bind('remove', this.onModelRemoved, this); },
		 * onModelAdded: function(model, collection, options) {
		 * _self.tabKeys[model.get("id")] = model; }, onModelRemoved: function
		 * (model, collection, options) { _self.tabKeys[model.get("id")] =
		 * null; }, }); this.tabs = new TabCollection([
		 * (routeHelper.routeModel) ]); var tabLayout = new
		 * TabLayout({collection: this.tabs});
		 * 
		 * vent.on("itemView:openGridRowInTab", function(itemModel) {
		 * vent.trigger("openGridRowInTab", itemModel); });
		 * vent.on("openGridRowInTab", function(itemModel) {
		 * console.log("openGridRowInTab"); _self.tabs.add(itemModel);
		 * vent.trigger("viewTab", itemModel); }); vent.on("viewTab",
		 * function(itemModel) { this.layout.contentRegion.show(new
		 * itemmodel.itemView(itemmodel)); //
		 * Backbone.history.navigate("client/"+_self.lastMainNavTabName+"/"+itemModel.get("id"), { //
		 * trigger : false // }); _self.syncMainNavigationState(null,
		 * itemModel.get("id")); });
		 * 
		 * this.layout.contentRegion.show(tabLayout); },
		 */
		syncMainNavigationState : function(modelForRoute) {
			var mainRoutePart = modelForRoute.getPathFragment(), contentNavTabName = modelForRoute.get("id");
			console.log("AbstractController#syncMainNavigationState, mainRoutePart: " + mainRoutePart + ", contentNavTabName: " + contentNavTabName);
			// update active nav menu tab
			if (mainRoutePart && mainRoutePart != this.lastMainNavTabName) {
				$('.navbar-nav li.active').removeClass('active');
				$('#mainNavigationTab-' + mainRoutePart).addClass('active');
				this.lastMainNavTabName = mainRoutePart;
			}
			// update active content tab
			if (contentNavTabName && contentNavTabName != this.lastContentNavTabName) {
				$('#calipsoTabLabelsRegion li.active').removeClass('active');
				$('#md-crud-layout-tab-label-' + contentNavTabName).addClass('active');
				// show coressponding content
				// console.log("show tab: "+contentNavTabName);
				$('#calipsoTabContentsRegion .tab-pane').removeClass('active');
				$('#calipsoTabContentsRegion .tab-pane').addClass('hidden');
				$('#tab-' + contentNavTabName).removeClass('hidden');
				$('#tab-' + contentNavTabName).addClass('active');
				this.lastContentNavTabName = contentNavTabName;
			}
		},
		tryExplicitRoute : function(mainRoutePart, secondaryRoutePart) {
			if (typeof this[mainRoutePart] == 'function') {
				// render explicit route
				this[mainRoutePart](secondaryRoutePart);
			}
		},

		editItem : function(item) {
			console.log("MainController#editItem, item: " + item);
		}

	});

	//////////////////////////////////////////
	// Model
	//////////////////////////////////////////
	/**
	 * Abstract model implementation to inherit from your own models.
	 * Subclasses of this model should follow the model driven
	 * design conventions used in the Calipso backbone stack, note the " REQUIRED" parts 
	 * of the example for details.
	 * 
	 * @exports models/generic-model
	 * @example 
	 * // Load module
	 * require(['models/generic-model'], function(GenericModel) {
	 * 	// define our person model subclass
	 * 	var PersonModel = GenericModel.extend({
	 * 		// add stuff here
	 * 	},
	 * 	// static members
	 * 	{
	 * 		// REQUIRED: the model superclass
	 * 		parent: GenericModelrties and functions here
	 * 	});
	 * 
	 * 	// REQUIRED: our subclass name
	 * 	PersonModel.prototype.getTypeName = function() {
	 * 		return "PersonModel";
	 * 	}
	 * 	// REQUIRED: our subclass URL path fragment, 
	 * 	// e.g. "users" for UserModel
	 * 	PersonModel.prototype.getPathFragment = function() {
	 * 		//...
	 * 	}
	 * 
	 * 	// REQUIRED: our subclass grid schema
	 * 	PersonModel.prototype.getGridSchema = function() {
	 * 		//...
	 * 	}
	 * 	// REQUIRED: our subclass form schema
	 * 	PersonModel.prototype.getFormSchemas = function() {
	 * 		//...
	 * 	}
	 * 
	 * 	// OPTIONAL: our subclass layout view, 
	 * 	// defaults to ModelDrivenBrowseLayout 
	 * 	PersonModel.prototype.getLayoutViewType = function() {
	 * 		//...
	 * 	}
	 * 	// OPTIONAL: our subclass collection view, 
	 * 	// defaults to ModelDrivenCollectionGridView 
	 * 	PersonModel.prototype.getCollectionViewType = function() {
	 * 		//...
	 * 	}
	 * 	// OPTIONAL: our subclass item view, 
	 * 	// defaults to ModelDrivenFormView
	 * 	PersonModel.prototype.getItemViewType = function() {
	 * 		//...
	 * 	}
	 * 	// OPTIONAL: our subclass item view template, 
	 * 	PersonModel.prototype.getItemViewTemplate = function() {
	 * 		//...
	 * 	}
	 * 	// OPTIONAL: our subclass business key, 
	 * 	// used to check if the model has been loaded from the server. 
	 * 	// defaults to "name" 
	 * 	PersonModel.prototype.GenericModel.prototype.getBusinessKey = function() {
	 * 		//...
	 * 	}
	 * 
	 * });   
	 * @constructor
	 * @requires Backbone
	 * @requires Supermodel
	 * @requires Backgrid
	 * @augments module:Supermodel.Model
	 */
	Calipso.model.GenericModel = Supermodel.Model.extend(
	/**
	 * @lends module:models/generic-model~GenericModel.prototype
	 */
	{
		/**
		 * Prefer the collection URL if any for more specific CRUD, fallback to
		 * own otherwise
		 */
		url : function() {
			var sUrl = this.collection ? _.result(this.collection, 'url') : _.result(this, 'urlRoot') || urlError();
			if (!this.isNew()) {
				sUrl = sUrl + (sUrl.charAt(sUrl.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.get("id"));
			}
			console.log("GenericModel#url: " + sUrl + ", is new: " + this.isNew() + ", id: " + this.get("id"));
			return sUrl;
		},

		/**
		 * Get the URL path fragment for this model
		 * @returns the URL path fragment as a string
		 */
		getPathFragment : function() {
			return this.prototype.getPathFragment();
		},
		/**
		 * Get the name of this class
		 * @returns the class name as a string
		 */
		getTypeName : function() {
			return this.prototype.getTypeName();
		},
		/**
		 * Get the layout view for this model. To specify a layout for your model under a static 
		 * or instance context, override {@link GenericModel.prototype.getLayoutViewType} 
		 * or {@link getLayoutViewType} respectively in your subclass. 
		 * 
		 * Layout views defined this way are picked up by controllers.
		 * 
		 * @see {@link GenericModel.prototype.getLayoutViewType}
		 */
		getLayoutViewType : function() {
			return this.prototype.getLayoutViewType();
		},
		/**
		 * Get the collection view type for collections of this model. To specify a collection 
		 * view for your model under a static or instance context, override 
		 * {@link GenericModel.prototype.getCollectionViewType} or 
		 * {@link getCollectionViewType} respectively in your subclass.
		 * 
		 * Collection views defined this way are picked up by layout views..
		 * 
		 * @see {@link GenericModel.prototype.getCollectionViewType}
		 */
		getCollectionViewType : function() {
			return this.prototype.getCollectionViewType();
		},
		/**
		 * Get the item view type for this model. To specify an item view for your model under a static 
		 * or instance context, override {@link GenericModel.prototype.getItemViewType} 
		 * or {@link getItemViewType} respectively in your subclass.
		 * 
		 * Layout views defined this way are picked up by controllers.
		 * 
		 * @see {@link GenericModel.prototype.getItemViewType}
		 */
		getItemViewType : function() {

			console.log("GenericModel.getItemViewType() called, will return GenericFormView");
			return this.prototype.getItemViewType();
		},
		/**
		 * Get the item view template for this model. the template is picked up and 
		 * used by item views like GenericView.  To specify an item view template for 
		 * your model under a static or instance context, 
		 * override {@link GenericModel.prototype.getItemViewTemplate} 
		 * or {@link getItemViewTemplate} respectively in your subclass.
		 * 
		 * Layout views defined this way are picked up by controllers.
		 * 
		 * @see {@link GenericModel.prototype.getItemViewType}
		 */
		getItemViewTemplate : function() {
			console.log("GenericModel.getItemViewTemplate() called");
			return this.prototype.getItemViewTemplate();
		},
		/**
		 * Get the complete set of form schemas. You can also obtain the form schema for 
		 * a specific action like "create", "update" or "search" using 
		 * {@linkcode getFormSchema} instead. 
		 * 
		 * To define form schemas for your subclass under a static or instance context, override 
		 * {@link GenericModel.prototype.getFormSchemas} or {@link getFormSchemas} respectively.
		 * 
		 * Form schemas are picked up by form views like {@linkcode GenericFormView} or layout views
		 * that use such form views in their regions.
		 * 
		 * @see {@link GenericModel.prototype.getFormSchema}
		 */
		getFormSchemas : function() {
			console.log("GenericModel.getFormSchemas");
			return this.prototype.getFormSchemas();
		},
		/**
		 * Get the form schema for a specific action like "create", "update" or "search". 
		 * 
		 * To define form schemas for your subclass under a static or instance context, override 
		 * {@link GenericModel.prototype.getFormSchemas} or {@link getFormSchemas} respectively.
		 * 
		 * Form schemas are used by form views like {@linkcode GenericFormView} or layout views
		 * that use such form views in their regions.
		 * 
		 * @param {string} actionName for example "create", "update" or "search"
		 * @see {@link getFormSchemas}
		 * @todo implement optional merging of superclass schemas by using the supermodel.parent property
		 */
		getFormSchema : function(actionName) {
			// decide based on model persistence state if no action was given
			console.log("GenericModel.getFormSchema, actionName: " + actionName);
			if (!actionName) {
				console.log("GenericModel.prototype.schema, this: " + this);
				console.log("GenericModel.prototype.schema, caller is " + arguments.callee.caller.toString());
				actionName = this.isNew() ? "create" : "update";
			}
			// the schema to build for the selected action
			var formSchema = {};
			// get the complete schema to filter out from
			var formSchemas = this.getFormSchemas();
			// console.log("GenericModel#schema actionName: "+actionName+",
			// formSchemas: "+formSchemas);

			// for each property, select the appropriate schema entry for the given
			// action
			var propertySchema;
			var propertySchemaForAction;
			for ( var propertyName in formSchemas) {
				if (formSchemas.hasOwnProperty(propertyName)) {
					propertySchema = formSchemas[propertyName];

					// if a schema exists for the property
					if (propertySchema) {
						// try obtaining a schema for the specific action
						propertySchemaForAction = propertySchema[actionName];
						// support wild card entries
						if (!propertySchemaForAction) {
							propertySchemaForAction = propertySchema["default"];
						}
						if (propertySchemaForAction) {
							formSchema[propertyName] = propertySchemaForAction;
						}
					}
				}

				// reset
				propertySchema = false;
				propertySchemaForAction = false;
			}
			// console.log("GenericModel#schema formSchema:
			// "+formSchema);
			return formSchema;
		},
		initialize : function() {
			Supermodel.Model.prototype.initialize.apply(this, arguments);
			var thisModel = this;
			this.on("change", function(model, options) {
				if (options && options.save === false) {
					return;
				}
			});
		}
	}, {
		// static members
		typeName : "GenericModel"
	});

	/**
	 * Get the model class URL fragment corresponding to your server 
	 * side controller, e.g. "users" for UserModel. Model subclasses 
	 * are required to implement this method. 
	 * @returns the URL path fragment as a string
	 */
	Calipso.model.GenericModel.prototype.getPathFragment = function() {
		throw "Model subclasses must implement GenericModel.prototype.getPathFragment";
	}
	/**
	 * Get the name of this class
	 * @returns the class name as a string
	 */
	Calipso.model.GenericModel.prototype.getTypeName = function() {
		return "GenericModel";
	}

	/**
	 * Override this to declaratively define 
	 * grid views for your subclass
	 */
	Calipso.model.GenericModel.prototype.getGridSchema = function() {
		console.log("GenericModel.prototype.getSchemaForGrid() called, will return undefined");
		return undefined;
	}

	/**
	 * Override this in your subclass to declaratively define 
	 * form views for the default or custom actions
	 */
	Calipso.model.GenericModel.prototype.getFormSchemas = function() {
		console.log("GenericModel.prototype.getFormSchema() called, will return undefined");
		return undefined;
	}

	/**
	 * Override this to define a default layout view at a static context for your subclass, 
	 * like {@link ModelDrivenCrudLayout} or {@link ModelDrivenBrowseLayout}
	 */
	Calipso.model.GenericModel.prototype.getLayoutViewType = function() {
		console.log("GenericModel.prototype.getLayoutViewType() called, will return ModelDrivenSearchLayout");
		return Calipso.view.ModelDrivenSearchLayout;
	}

	/**
	 * Override this to define a default collection view like the 
	 * default {@link ModelDrivenCollectionGridView} 
	 * at a static context for your subclass, 
	 *@returns {@link ModelDrivenCollectionGridView}
	 */
	Calipso.model.GenericModel.prototype.getCollectionViewType = function() {
		console.log("GenericModel.prototype.getCollectionViewType() called, will return ModelDrivenCollectionGridView");
		return Calipso.view.ModelDrivenCollectionGridView;
	}

	/**
	 * Override this to define a default layout view at a static context for your subclass, 
	 * like {@link ModelDrivenCrudLayout} or {@link ModelDrivenSearchLayout}
	 */
	Calipso.model.GenericModel.prototype.getItemViewType = function() {
		console.log("GenericModel.prototype.getItemViewType() called, will return GenericFormView");
		return Calipso.view.GenericFormView;
	}
	/**
	 * Override this to define a default layout view at a static context for your subclass, 
	 * like {@link ModelDrivenCrudLayout} or {@link ModelDrivenSearchLayout}
	 */
	Calipso.model.GenericModel.prototype.getItemViewTemplate = function() {
		console.log("GenericModel.prototype.getItemViewTemplate() called, will return null");
		return null;
	}
	/**
	 * Get the name of the model's business key property. The property name is used to 
	 * check whether a model instance has been loaded from the server. The default is "name".
	 * 
	 * @returns the business key if one is defined by the model class, "name" otherwise
	 */
	Calipso.model.GenericModel.prototype.getBusinessKey = function() {
		return "name";
	}

	Calipso.model.UserModel = Calipso.model.GenericModel.extend({
		urlRoot : "/api/rest/users"
	}, {
		// static members
		parent : Calipso.model.GenericModel
	});

	/**
	 * Get the model class URL fragment corresponding this class
	 * @returns the URL path fragment as a string
	 */
	Calipso.model.UserModel.prototype.getPathFragment = function() {
		return "users";
	}
	Calipso.model.UserModel.prototype.getTypeName = function() {
		return "UserModel";
	}
	Calipso.model.UserModel.prototype.getFormSchemas = function() {

		return {//
			userName : {
				"search" : {
					type : 'Text'
				},
				"update" : {
					type : 'Text',
					validators : [ 'required' ],
					editorAttrs : {
						'readonly' : 'readonly'
					}
				},
				"default" : {
					type : 'Text',
					validators : [ 'required' ]
				}
			},
			firstName : {
				"search" : 'Text',
				"default" : {
					type : 'Text',
					validators : [ 'required' ]
				}
			},
			lastName : {
				"search" : 'Text',
				"default" : {
					type : 'Text',
					validators : [ 'required' ]
				}
			},
			email : {
				"search" : {
					type : 'Text',
					validators : [ 'email' ]
				},
				"default" : {
					type : 'Text',
					validators : [ 'required', 'email' ]
				}
			}
		};

	}

	Calipso.model.UserModel.prototype.getGridSchema = function() {
		return [ {
			name : "userName",
			label : "username",
			cell : Calipso.components.ViewRowCell,
			editable : false
		}, {
			name : "firstName",
			label : "firstName",
			editable : false,
			cell : "string"
		}, {
			name : "lastName",
			label : "lastName",
			editable : false,
			cell : "string"
		}, {
			name : "email",
			label : "email",
			cell : "email",
			editable : false
		}, {
			name : "createdDate",
			label : "created",
			cell : "date",
			editable : false
		}, {
			name : "edit",
			label : "",
			editable : false,
			cell : Calipso.components.EditInTabCell
		} ];
	}
	Calipso.model.UserDetailsModel = Backbone.Model.extend({

		url : baseUrl + '/api-auth',

		sync : function(method, model, options) {
			options = options || {};
			options.timeout = 30000;
			// options.dataType = "jsonp"; // JSON is default.
			return Backbone.sync(method, model, options);
		}

	});
	/**
	 * Get the model class URL fragment corresponding this class
	 * @returns the URL path fragment as a string
	 */
	Calipso.model.UserDetailsModel.prototype.getPathFragment = function() {
		return "userDetails";
	}

	Calipso.model.UserDetailsModel.prototype.getTypeName = function() {
		return "UserDetailsModel";
	}
	//////////////////////////////////////////////////
	// Layouts
	//////////////////////////////////////////////////
	Calipso.components.ViewRowCell = Backgrid.StringCell.extend({
		className : "view-row-cell",
		initialize : function(options) {
			Backgrid.StringCell.prototype.initialize.apply(this, arguments);
			this.viewRowEvent = "collectionView:viewItem";
		},
		events : {
			"click" : "viewRow"
		},
		viewRow : function(e) {
			console.log("ViewRowCell#viewRow, rowModel: " + this.model.getTypeName());
			e.stopPropagation();
			e.preventDefault();

			Calipso.vent.trigger(this.viewRowEvent, this.model);
			// var rowModel = this.model;
			// Backbone.history.navigate("client/"+rowModel.get("apiUrlSegment")+"/"+rowModel.get("id"),
			// {
			// trigger : true
			// });
		},
		render : function() {
			this.$el.empty();
			var model = this.model;
			var formattedValue = this.formatter.fromRaw(model.get(this.column.get("name")), model);
			this.$el.append($("<a>", {
				tabIndex : -1,
				title : formattedValue
			}).text(formattedValue));
			this.delegateEvents();
			return this;
		}

	});

	Calipso.components.EditInTabCell = Backgrid.Cell.extend({
		tagName : "td class='modal-button-cell modal-button-cell-edit'",
		template : _.template('<button class="btn btn-xs btn-warning"><span class="glyphicon glyphicon-edit"></span></button>'),
		events : {
			"click" : "editRow"
		},
		editRow : function(e) {
			//						var thisModal = this;
			console.log("EditInTabCell#editRow ");
			e.stopPropagation();
			e.preventDefault();
			var rowModel = this.model;
			console.log("editRow, rowModel: " + rowModel.constructor.name);
			CalipsoApp.vent.trigger("editItem", rowModel);
		},
		render : function() {
			this.$el.html(this.template());
			this.delegateEvents();
			return this;
		}
	});
	//////////////////////////////////////////////////
	// Layouts
	//////////////////////////////////////////////////
	Calipso.view.ModelDrivenBrowseLayout = Marionette.Layout.extend({
		tagName : 'div',
		className : 'col-sm-12',
		id : "calipsoModelDrivenBrowseLayout",
		template : require('hbs!template/md-browse-layout'),// _.template(templates.applayout),
		skipToSingleResult : true,
		regions : {
			contentRegion : "#calipsoModelDrivenBrowseLayout-contentRegion"
		},
		onShow : function() {
			this.showContent(this.model);
		},
		initialize : function(options) {

			Marionette.Layout.prototype.initialize.apply(this, arguments);

			if (options.skipToSingleResult) {
				this.skipToSingleResult = true;
			}
			if (options.model) {
				this.model = options.model;
				if (this.model.wrappedCollection) {
					this.searchResultsCollection = this.model.wrappedCollection;
				}
			}

			this.listenTo(Calipso.vent, "ViewInTabCell:viewGridRow", function(itemModel) {
				//  get item view type for model
				var ItemViewType = itemModel.getItemViewType();
				console.log("ModelDrivenBrowseLayout on itemView:openGridRowInTab, ItemViewType: " + ItemViewType.getTypeName());
				// create new item view instance with model
				var itemView = new ItemViewType({
					formSchemaKey : "view",
					model : itemModel
				});
				// TODO: register for close and return to results

				// show item view
				this.contentRegion.show(itemView);
			}, this);

			//				if(options.model){
			//					this.model = options.model;
			//				}
			//				if(this.options.searchResultsCollection){
			//					this.searchResultsCollection = options.searchResultsCollection;
			//				}
			//				console.log("GenericSearchLayout.initialize, model: " + (this.model ? this.model.getTypeName() : this.model));
			//				console.log("GenericSearchLayout.initialize, searchResultsCollection: " + (this.searchResultsCollection ? this.searchResultsCollection.length : this.searchResultsCollection));
		},
		showViewForSelected : function() {

		},
		showContent : function(routeModel) {
			var _this = this;
			console.log("ModelDrivenBrowseLayout.showContent: '" + routeModel.get("id") + "', skipToSingleResult: " + _this.skipToSingleResult + ", collection length: " + (routeModel.wrappedCollection ? routeModel.wrappedCollection.length : "none"));
			// get the model collection view type
			var ContentViewType;
			var contentView;
			if ((!routeModel.get("id")) || routeModel.get("id") == "search" || routeModel.wrappedCollection) {
				console.log("GenericSearchLayout#showContent 1");
				if (_this.skipToSingleResult && routeModel.wrappedCollection.length == 1) {
					console.log("GenericSearchLayout#showContent 1.1");
					// show single result: 
					// pick the right item view to render the 
					// single search result
					ContentViewType = wrapperModel.getItemViewType();
					contentView = new ContentViewType({
						model : routeModel.wrappedCollection.first()
					});
				} else {
					console.log("GenericSearchLayout#showContent 1.2");
					ContentViewType = routeModel.getCollectionViewType();
					contentView = new ContentViewType({
						model : routeModel,
						callCollectionFetch : true
					});
				}

			} else {
				console.log("GenericSearchLayout#showContent 2");
				ContentViewType = routeModel.getItemViewType();
				// create a new collection instance
				contentView = new ContentViewType({
					model : routeModel,
					callCollectionFetch : true
				});

			}
			console.log("ModelDrivenBrowseLayout.showContent, ContentViewType: " + ContentViewType.getTypeName());

			//TODO reuse active view if of the same type
			this.contentRegion.show(contentView);
		}
	}, {
		// static members
		getTypeName : function() {
			return "ModelDrivenBrowseLayout"
		}
	});

	Calipso.view.ModelDrivenSearchLayout = Calipso.view.ModelDrivenBrowseLayout.extend({
		tagName : 'div',
		id : "calipsoModelDrivenSearchLayout",
		template : require('hbs!template/md-search-layout'),
		hideSidebarOnSearched : false,
		initialize : function(options) {
			var _this = this;
			Calipso.view.ModelDrivenBrowseLayout.prototype.initialize.apply(this, arguments);
			if (options.hideSidebarOnSearched) {
				this.hideSidebarOnSearched = true;
			}
			if (this.options.searchResultsCollection) {
				this.searchResultsCollection = options.searchResultsCollection;
			}
			console.log("GenericSearchLayout.initialize, model: " + (this.model ? this.model.getTypeName() : this.model));
			console.log("GenericSearchLayout.initialize, searchResultsCollection: " + (this.searchResultsCollection ? this.searchResultsCollection.length : this.searchResultsCollection));

			// bind to collection item selection events (view/edit)
			_this.listenTo(Calipso.vent, "collectionView:viewItem", function(itemModel) {
				_this.viewItem(itemModel);
			}, _this);
			_this.listenTo(Calipso.vent, "collectionView:viewItemMaximized", function(itemModel) {
				_this.viewItemMaximized(itemModel);
			}, _this);

			// bind to events coresponding to successful
			// retreival of search results
			this.listenTo(Calipso.vent, "genericFormSearched", function(wrapperModel) {
				var _this = this;
				var searchResultsCollection = wrapperModel.wrappedCollection;
				console.log("ModelDrivenSearchLayout caught 'genericFormSearched' event: search form notified of retreived search results");

				var ContentViewType;
				if (this.skipToSingleResult && searchResultsCollection.length == 1) {
					// show single result: 
					// pick the right item view to render the 
					// single search result
					ContentViewType = wrapperModel.getItemViewType();
					var searchResultsView = new ContentViewType({
						model : searchResultsCollection.first()
					});
				} else {
					// pick up the right view to render the 
					// search results collection
					ContentViewType = wrapperModel.getCollectionViewType();

					// create the search results view instance
					var searchResultsView = new ContentViewType({
						model : wrapperModel
					});

				}
				console.log("ModelDrivenSearchLayout#showSidebar, this.hideSidebarOnSearched:" + this.hideSidebarOnSearched);

				if (_this.hideSidebarOnSearched) {
					_this.hideSidebar();
				} else {

					console.log("ModelDrivenSearchLayout#showSidebar, preserving sidebar");
				}

				// show the results				
				_this.contentRegion.show(searchResultsView);
				var searchedUrl = Calipso.contextPath + "client/" + wrapperModel.getPathFragment();
				if (_this.searchResultsCollection && _this.searchResultsCollection.data) {
					searchedUrl = searchedUrl + "?" + $.param(_this.searchResultsCollection.data);
				} else {
					console.log("genericFormSearched, collection has no data ");
				}

				console.log("genericFormSearched, changing url: " + searchedUrl);

				Backbone.history.navigate(searchedUrl, {
					trigger : false
				});

			}, this);

		},
		regions : {
			sidebarRegion : "#calipsoModelDrivenSearchLayout-sideBarRegion",
			contentRegion : "#calipsoModelDrivenSearchLayout-contentRegion"
		},
		onShow : function() {
			this.showSidebar(this.model);
			this.showContent(this.model);
		},
		showSidebar : function(routeModel) {
			var _this = this;
			// create the search form view
			var formView = new Calipso.view.GenericFormView({
				formSchemaKey : "search",
				model : routeModel
			});

			// show the search form
			this.sidebarRegion.show(formView);
		},
		viewItem : function(itemModel) {
			console.log("ModelDrivenSearchLayout caught 'collectionView:viewItem' event");

			// get the itemView type for the given model
			var ItemViewType = itemModel.getItemViewType();

			// create a view instance for the given model
			var itemView = new ItemViewType({
				model : itemModel,
				callCollectionFetch : true
			});
			// show the results				
			this.contentRegion.show(itemView);
		},
		hideSidebar : function() {
			this.$el.find("#calipsoModelDrivenSearchLayout-sideBarRegion").hide();
			this.$el.find("#calipsoModelDrivenSearchLayout-contentRegion").removeClass("col-sm-9").addClass("col-sm-12");
		},
		viewItemMaximized : function(itemModel) {
			console.log("ModelDrivenSearchLayout caught 'collectionView:viewItemMaximized' event");
			this.hideSidebar();
			this.viewItem(itemModel);
		}
	}, {
		getTypeName : function() {
			return "ModelDrivenSearchLayout"
		}
	});

	Calipso.view.NotFoundView = Marionette.ItemView.extend({
		className : 'container span8 home',
		template : require('hbs!template/notfound'),

		initialize : function(options) {
			_.bindAll(this);
		}

	}, {
		getTypeName : function() {
			return "NotFoundView"
		}
	});
	Calipso.view.HeaderView = Marionette.ItemView.extend({

		template : require('hbs!template/header'),
		id : "navbar-menu",
		className : "col-sm-12",
		initialize : function(options) {
			_.bindAll(this);
		}
	}, {
		getTypeName : function() {
			return "HeaderView"
		}
	});
	Calipso.view.FooterView = Marionette.ItemView.extend({

		template : require('hbs!template/footer'),
		id : "navbar-menu",
		className : "col-sm-12",
		initialize : function(options) {
			_.bindAll(this);
		}
	}, {
		getTypeName : function() {
			return "FooterView"
		}
	});
	Calipso.view.ModelDrivenCollectionGridView = Marionette.ItemView.extend(
	/**
	 * @param options object members: 
	 *  - collection/wrappedCollection
	 *  - callCollectionFetch: whether to fetch the collection from the server
	 * @lends collection/GenericCollectionGridView.prototype 
	 * */
	{
		events : {
			"click button.btn-windowcontrols-close" : "back"
		},

		back : function(e) {
			e.preventDefault();
			window.history.back();
		},
		initialize : function(options) {

			Marionette.ItemView.prototype.initialize.apply(this, arguments);
			if (options.collection) {
				this.collection = options.collection;
			} else if (options.model && options.model.wrappedCollection) {
				this.collection = options.model.wrappedCollection;
			}
			if (!this.collection) {
				throw "no collection or collection wrapper model was provided";
			}

			if (options.callCollectionFetch) {
				this.callCollectionFetch = options.callCollectionFetch;
			}
			console.log("GenericCollectionGridView.initialize, callCollectionFetch: " + this.callCollectionFetch);
			console.log("GenericCollectionGridView.initialize, collection: " + (this.collection ? this.collection.length : this.collection));
		},
		onCollectionFetched : function() {

		},
		// Define view template
		template : require('hbs!template/md-collection-grid-view'),
		onShow : function() {
			var _self = this;
			console.log("GenericCollectionGridView.onShow,  _self.collection.url: " + _self.collection.url);

			// console.log("GenericCollectionGridView onShow, this.collection:
			// "+this.collection + ", gridCollection: "+gridCollection);
			var backgrid = new Backgrid.Grid({
				columns : _self.collection.getGridSchema(),
				collection : _self.collection,
				emptyText : "No records found"
			});
			//		'collection/generic-collection.js"	
			// console.log("$('#backgrid').attr(id): "+$('#backgrid').attr("id"));
			this.$('.backgrid-table-container').append(backgrid.render().$el);
			_self.listenTo(_self.collection, "backgrid:refresh", _self.showFixedHeader);
			var paginator = new Backgrid.Extension.Paginator({

				// If you anticipate a large number of pages, you can adjust
				// the number of page handles to show. The sliding window
				// will automatically show the next set of page handles when
				// you click next at the end of a window.
				windowSize : 20, // Default is 10

				// Used to multiple windowSize to yield a number of pages to slide,
				// in the case the number is 5
				slideScale : 0.25, // Default is 0.5

				// Whether sorting should go back to the first page
				goBackFirstOnSort : false, // Default is true

				collection : _self.collection
			});

			this.$('.backgrid-paginator-container').append(paginator.render().el);
			//						console.log("GenericCollectionGridView.onShow, collection url: "+);

			if (this.callCollectionFetch) {
				var fetchOptions = {
					reset : true,
					url : _self.collection.url,
					success : function() {
						_self.onCollectionFetched();
						_self.$(".loading-indicator").hide();
						_self.$(".loading-indicator-back").hide();
					}
				};
				if (_self.collection.data) {
					if (_self.collection.data[""] || _self.collection.data[""] == null) {
						delete _self.collection.data[""];
						//console.log("GenericCollectionGridView.onShow, deletted empty key in given .data, source: "+_self.collection.data.toSource());
					}
					fetchOptions.data = _self.collection.data;
					//console.log("GenericCollectionGridView.onShow, fetchOptions.data: "+fetchOptions.data.toSource());
				}
				_self.collection.fetch(fetchOptions);
				this.callCollectionFetch = false;
			} else {
				_self.$(".loading-indicator").hide();
				_self.$(".loading-indicator-back").hide();
				_self.showFixedHeader();
			}
			// this.collection.fetch();main info

			// console.log("GenericCollectionGridView showed");

		},
		showFixedHeader : function() {
			var fixedHeaderContainer = this.$el.find(".backgrid-fixed-header");
			if (fixedHeaderContainer.length > 0) {
				var tableOrig = this.$el.find(".backgrid").first();
				var table_clone = tableOrig.clone().removeClass('backgrid').empty();
				var origThead = this.$el.find(".backgrid > thead");

				table_clone.append(origThead.clone()).addClass('header_fixed backgrid_clone').css('left', tableOrig.offset().left);

				fixedHeaderContainer.empty().append(table_clone);

				tableOrig.find('tbody tr').first().children().each(function(i, e) {
					$(table_clone.find('tr').children()[i]).width($(e).width());
				});
				origThead.hide();
				table_clone.removeAttr('style');
				console.log("GenericCollectionGridView showFixedHeader, added header");
			} else {
				console.log("GenericCollectionGridView showFixedHeader, skipped adding header");
			}

			//tableOrig.find('thead').first().hide();
		}

	},
	// static members
	{
		getTypeName : function() {
			return "ModelDrivenCollectionGridView";
		}
	});

	Calipso.view.MainContentNavView = Marionette.ItemView.extend({

		// Define view template
		template : require('hbs!template/MainContentNavView'),

		initialize : function(options) {
			Marionette.ItemView.prototype.initialize.apply(this, arguments);
			this.getTypeName() = "MainContentNavView";
		},
		onDomRefresh : function() {
			console.log("MainContentTabsView onDomRefresh");
		}

	}, {
		getTypeName : function() {
			return "MainContentNavView"
		}
	});

	Calipso.view.GenericView = Marionette.ItemView.extend({
		// Define view template
		tagName : 'div',
		className : "calipsoView",
		events : {
			"click button.close" : "back"
		},

		back : function(e) {
			e.preventDefault();
			window.history.back();
		},
		// dynamically set the id
		initialize : function(options) {

			Marionette.ItemView.prototype.initialize.apply(this, arguments);
			this.$el.prop("id", "tab-" + this.model.get("id"));
			var itemViewTemplate = this.model.getItemViewTemplate();
			if (itemViewTemplate) {
				this.tmpl = itemViewTemplate;
			}

			this.formTemplate = this.options.formTemplate ? this.options.formTemplate : Backbone.Form.template;
			var modelUrl = session.getBaseUrl() + "/api/rest" + "/" + this.model.getPathFragment() + "/" + this.model.get("id");
			console.log("GenericView#initialize, fetching model " + modelUrl);
			this.model.fetch({
				async : false,
				url : modelUrl
			});
		},
		formSchemaKey : "view",
	}, {
		// static members
		getTypeName : function() {
			return "GenericView";
		}
	});

	Calipso.view.GenericFormView = Marionette.ItemView.extend({
		// Define view template
		template : require('hbs!template/GenericFormView'),
		templateHelpers : {
			formSchemaKey : function() {
				return this.formSchemaKey;
			}
		},
		initialize : function(options) {
			console.log("GenericFormView#initialize, model: " + this.model.getTypeName());
			Marionette.ItemView.prototype.initialize.apply(this, arguments);

			// set schema action/key
			if (options.formSchemaKey) {
				this.formSchemaKey = options.formSchemaKey;
			} else if (this.model) {
				this.formSchemaKey = this.model.isNew() ? "create" : "view";
			} else {
				this.formSchemaKey = "search";
			}
			console.log("GenericFormView#initialize, formSchemaKey: " + this.formSchemaKey);

			// ensure we can use some sort of unique form id
			if (!this.model.get("id")) {
				this.model.set("id", this.formSchemaKey);
			}

			// grab a handle for the search results collection if any
			if (this.model.wrappedCollection) {
				this.searchResultsCollection = this.model.wrappedCollection;
			} else if (this.options.searchResultsCollection) {
				this.searchResultsCollection = options.searchResultsCollection;
			}

			this.formTemplate = this.options.formTemplate ? this.options.formTemplate : Backbone.Form.template;

			console.log("GenericFormView.initialize, this.formSchemaKey: " + this.formSchemaKey + ",  searchResultsCollection: " + " of type " + this.model.getTypeName());

			// console.log("GenericFormView#onShow, formSchemaKey:
			// "+formSchemaKey+", model:
			// "+this.model.constructor.name+this.model.constructor);

		},
		formSchemaKey : "view",

		events : {
			"click button.submit" : "commit",
			"submit" : "commitOnEnter",
			"keypress input[type=text]" : "commitOnEnter"
		},
		commitOnEnter : function(e) {
			if (e.keyCode != 13) {
				return;
			} else {
				this.commit(e);
			}
		},
		commit : function(e) {
			// TODO: make utility method
			if (e.stopPropagation) {
				e.stopPropagation();
			} else {
				e.returnValue = false;
			}
			e.preventDefault();
			console.log(this.formSchemaKey + ".substring(0, 6): " + this.formSchemaKey.substring(0, 6));
			if (window.Placeholders) {
				Placeholders.disable();
			}

			// runs schema and model validation
			var errors = this.form.commit({
				validate : true
			});
			var _this = this;
			// Case: create/update
			if (_this.formSchemaKey == "create" || _this.formSchemaKey == "update") {
				// persist changes
				//this.model.save();
				// signal save event for the model
				Calipso.vent.trigger("genericFormSave", _this.model);
			}
			// Case: search 
			else if (this.formSchemaKey.substring(0, 6) == "search") {
				var errors = this.form.commit({
					validate : true
				});
				if (errors) {
					var errorMsg = "" + errors._others;
					alert(errorMsg);
					if (window.Placeholders) {
						Placeholders.enable();
					}
					return false;
				}
				console.log("GenericFormView#commit, saving search data to session");
				var newData = this.form.toJson();
				this.searchResultsCollection.data = newData;
				this.searchResultsCollection.fetch({
					reset : true,
					data : newData,
					success : function() {
						// signal successful retreival of search results
						// for the currently active layout to handle presentation
						console.log("GenericFormView#commit: search success, triggering: genericFormSearched");
						Calipso.vent.trigger("genericFormSearched", _this.model);
					},

					// Generic error, show an alert.
					error : function(model, response) {
						alert("Failed retreiving search results");
					}

				});
			}
			// search entities?
		},
		onShow : function() {
			var _self = this;
			// get appropriate schema
			//					console.log("GenericFormView.onShow, this.formSchemaKey: "+this.formSchemaKey);

			var selector = '#generic-form-' + this.formSchemaKey + "-" + this.model.get("id");
			var schemaForAction = this.model.getFormSchema(this.formSchemaKey);

			console.log("GenericFormView#onShow, selector: " + selector + ", formSchemaKey: " + this.formSchemaKey + ", model id: " + this.model.get("id") + ", schema: " + schemaForAction);

			// render form
			var JsonableForm = Backbone.Form.extend({
				toJson : function() {
					return _.reduce(this.$el.serializeArray(), function(hash, pair) {
						if (pair.value) {
							hash[pair.name] = pair.value;
						}
						return hash;
					}, {});
				},
			});

			if (Calipso.session.searchData && (!_self.searchResultsCollection.data)) {
				console.log("GenericFormView#onShow, Adding session.searchData to form model");
				_self.model.set(session.searchData);
				_self.searchResultsCollection.data = session.searchData;
			} else {
				console.log("GenericFormView#onShow, No session.searchData to add");
			}
			//console.log("GenericformView#onShow: " + schemaForAction.toSource());
			var formOptions = {
				model : _self.model,
				schema : schemaForAction,
				template : _self.formTemplate
			};
			this.form = new JsonableForm(formOptions).render();
			$(selector).append(this.form.el);
			//					$(selector + ' textarea[data-provide="markdown"]').each(function() {
			//						var $this = $(this);
			//
			//						if ($this.data('markdown')) {
			//							$this.data('markdown').showEditor()
			//						} else {
			//							$this.markdown($this.data())
			//						}
			//
			//					});
		},
		getFormData : function getFormData($form) {
			var unindexed_array = $form.serializeArray();
			var indexed_array = {};

			$.map(unindexed_array, function(n, i) {
				indexed_array[n['name']] = n['value'];
			});

			return indexed_array;
		}
	},
	// static members
	{
		getTypeName : function() {
			return "GenericFormView"
		}
	});

	Calipso.view.AbstractItemView = Backbone.Marionette.ItemView.extend({

		initialize : function(options) {

			if (!options || !options.id) {
				this.id = _.uniqueId(this.getTypeName() + "_");
				$(this.el).attr('id', this.id);
				console.log("Created dynamic id: " + options.id);
			}
			Marionette.ItemView.prototype.initialize.apply(this, arguments);
		},
		//				render : function() {
		//					$(this.el).attr('id', Marionette.getOption(this, "id"));
		//				},
		templateHelpers : {
			viewId : function() {
				return Marionette.getOption(this, "id");
			}
		},
		getTypeName : function() {
			return this.constructor.getTypeName();
		},
		//override toString to return something more meaningful
		toString : function() {
			return this.getTypeName() + "(" + JSON.stringify(this.attributes) + ")";
		}
	}, {
		getTypeName : function() {
			return "AbstractItemView"
		}
	});

	Calipso.view.AbstractLayoutView = Backbone.Marionette.Layout.extend({
		getTypeName : function() {
			return this.constructor.getTypeName();
		}
	}, {
		getTypeName : function() {
			return "AbstractLayoutView"
		}
	});

	Calipso.view.AbstractLoginView = Marionette.ItemView.extend({

		className : 'col-sm-12 calipsoAbstractLoginView',

		template : require('hbs!template/login'),
		/**
		 * Get the name of this class
		 * @returns the class name as a string
		 */
		getTypeName : function() {
			return this.prototype.getTypeName();
		},
		events : {
			"click button" : "commit",
			"submit" : "commit"
		},
		commit : function(e) {
			e.preventDefault();

			var _this = this;
			var userDetails = new UserModel({
				email : this.$('.input-email').val(),
				password : this.$('.input-password').val(),
				newPassword : this.$('.new-password').val(),
				newPasswordConfirm : this.$('.new-password-confirm').val(),
			// was used for testing
			// metadata: {"loginViewMetadatum":"true"}
			});
			session.save(userDetails);

		}
	}, {

	});

	/**
	 * Get the name of this class
	 * @returns the class name as a string
	 */
	Calipso.view.AbstractLoginView.prototype.getTypeName = function() {
		return "AbstractLoginView";
	}
	Calipso.view.AppLayoutView = Calipso.view.AbstractLayoutView.extend({
		tagName : "div",
		template : require('hbs!template/applayout'),// _.template(templates.applayout),
		regions : {
			navRegion : "#calipsoAppLayoutNavRegion",
			contentRegion : "#calipsoAppLayoutContentRegion"
		}
	}, {
		getTypeName : function() {
			return "AppLayoutView"
		}
	});

	Calipso.app = new Marionette.Application({
		routers : {}
	});
	// application configuration
	Calipso.app.addRegions({
		headerRegion : "#calipsoHeaderRegion",
		mainContentRegion : "#calipsoMainContentRegion",
		modal : Calipso.view.ModalRegion,
		footerRegion : "#calipsoFooterRegion"
	});

	Calipso.app.addInitializer(function(options) {
		// we neeed to override loadTemplate because Marionette expect to recive only the template ID
		// but actually it's the full template html (require + text plugin)
		//			    Backbone.Marionette.TemplateCache.prototype.loadTemplate = function (templateId) {
		//			      var template = templateId;
		//			      // remove this comment if you want to make sure you have a template before trying to compile it
		//			      /*
		//			      if (!template || template.length === 0) {
		//			        var msg = "Could not find template: '" + templateId + "'";
		//			        var err = new Error(msg);
		//			        err.name = "NoTemplateError";
		//			        throw err;
		//			      }*/
		//
		//			      return template;
		//			    };

		// init ALL app routers
		_(options.routers).each(function(routerClass) {
			console.log("initialize router type: " + router);
			var router = new routerClass();
			Calipso.app.routers[routerClass.getTypeName()] = router;
			console.log("initialized router: " + router);
		});

		Calipso.modelTypesMap = {};
		_(Calipso.model).each(function(ModelClass) {
			var model = new ModelClass();
			console.log("initialize model type: " + model.getTypeName());
			if (model.getTypeName() != "GenericModel") {

				Calipso.modelTypesMap[model.getPathFragment()] = ModelClass;
				console.log("initialized model type: " + model.getTypeName() + " and key: " + model.getPathFragment());
			}
		});

	});

	////////////////////////////////
	// vent and app events
	////////////////////////////////
	// initialize header, footer, history
	Calipso.app.on("initialize:after", function() {
		console.log("app event initialize:after");
		//	try "remember me"
		Calipso.session.load();
		// render basic structure
		Calipso.app.headerRegion.show(new Calipso.view.HeaderView({
			model : Calipso.session.userDetails
		}));
		// app.mainContentNavRegion.show(new MainContentNavView());
		Calipso.app.footerRegion.show(new Calipso.view.FooterView());

		Backbone.history.start({
			pushState : true,
			hashChange : false,
			root : "/",
			useBackboneNavigate : true
		});
		// TODO: hostpages
		// { pushState: true, hashChange: false, root: "/" }

	});

	Calipso.util.Vent = {};

	Calipso.util.Vent = Backbone.Wreqr.EventAggregator.extend({

		constructor : function(debug) {

			this.commands = new Backbone.Wreqr.Commands();
			this.reqres = new Backbone.Wreqr.RequestResponse();

			Backbone.Wreqr.EventAggregator.prototype.constructor.apply(this, arguments);

		}

	});

	_.extend(Calipso.util.Vent.prototype, {
		// Command execution, facilitated by Backbone.Wreqr.Commands
		execute : function() {
			var args = Array.prototype.slice.apply(arguments);
			this.commands.execute.apply(this.commands, args);
		},

		// Request/response, facilitated by Backbone.Wreqr.RequestResponse
		request : function() {
			var args = Array.prototype.slice.apply(arguments);
			return this.reqres.request.apply(this.reqres, args);
		}
	});

	Calipso.vent = new Calipso.util.Vent();

	Calipso.vent.on('app:show', function(appView) {
		// console.log("vent event app:show, appView: "+appView.getTypeName());

		Calipso.app.mainContentRegion.show(appView);
	});
	Calipso.vent.on('session:created', function(userDetails) {
		console.log("vent event session:created");
		Calipso.session.userDetails = userDetails;
		Calipso.app.headerRegion.show(new Calipso.view.HeaderView({
			model : userDetails
		}));

		// send logged in user on their way
		var fw = Calipso.app.fw ? Calipso.app.fw : "/calipso/client/home";
		console.log("session:created, update model: " + userDetails.get("email") + ", navigating to: " + fw);

		Backbone.history.navigate(fw, {
			trigger : true
		});
		//window.location = fw;
	});
	Calipso.vent.on('session:destroy', function(userDetails) {
		Calipso.session.destroy();
		Backbone.history.navigate("client/login", {
			trigger : true
		});
	});
	Calipso.vent.on('nav-menu:change', function(modelkey) {
		console.log("vent event nav-menu:change");

	});
	Calipso.vent.on('modal:show', function(view) {
		console.log("vent event modal:show");
		Calipso.app.modal.show(view);
	});
	Calipso.vent.on('modal:close', function() {
		console.log("vent event modal:close");
		Calipso.app.modal.hideModal();
	});

	//////////////////////////////////////////////////
	// session
	//////////////////////////////////////////////////
	var baseUrl;
	var calipsoMainScript = document.getElementById("calipso-script-main");
	// calipso in host page
	if (calipsoMainScript) {
		var basePathEnd = calipsoMainScript.src.indexOf("/js/lib/require.js");
		baseUrl = calipsoMainScript.src.substring(0, basePathEnd);
	} else {
		// fallback, will only work with a root web application context
		baseUrl = window.location.protocol + "//" + window.location.host;
	}
	console.log("session, base URL:" + baseUrl);

	//
	Calipso.util.Session = Backbone.Model.extend({
		userDetails : false,
		// Creating a new session instance will attempt to load
		// the user using a "remember me" cookie token, if one exists.
		initialize : function() {
			this.load();
		},

		// Returns true if the user is authenticated.
		isAuthenticated : function() {
			return this.userDetails && this.userDetails.get && this.userDetails.get("id");
		},
		ensureLoggedIn : function() {
			if (!this.isAuthenticated()) {
				this.fw = "/client/" + routeHelper.mainRoutePart;
				// we do not need the Search suffix in the route path to match
				if (routeHelper.contentNavTabName != "Search") {
					this.fw += "/" + routeHelper.contentNavTabName;
					// TODO: note HTTP params
				}
				Backbone.history.navigate("client/login", {
					trigger : true
				});

				$('#session-info').hide();
			}
		},
		// used to store an intercepted URL for use at a later time, for example
		// after login
		fw : null,

		createCookie : function(name, value, days) {
			var expires;
			if (days) {
				var date = new Date();
				date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
				expires = "; expires=" + date.toGMTString();
			} else {
				expires = "";
			}
			document.cookie = name + "=" + value + expires + "; path=/";
		},
		getCookie : function(c_name) {
			if (document.cookie.length > 0) {
				c_start = document.cookie.indexOf(c_name + "=");
				if (c_start != -1) {
					c_start = c_start + c_name.length + 1;
					c_end = document.cookie.indexOf(";", c_start);
					if (c_end == -1) {
						c_end = document.cookie.length;
					}
					return unescape(document.cookie.substring(c_start, c_end));
				}
			}
			return "";
		},
		deleteCookie : function(name, path, domain) {
			if (getCookie(name)) {
				document.cookie = name + "=" + ((path) ? ";path=" + path : "") + ((domain) ? ";domain=" + domain : "") + ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
			}
		},
		// Saving will try to login the user
		save : function(model) {
			console.log("session.save called");
			var _self = this;
			var userNameOrEmail = model.get('email') ? model.get('email') : model.get('username');
			new UserDetailsModel().save({
				email : userNameOrEmail,
				password : model.get('password'),
				metadata : model.get('metadata'),
			}, {
				success : function(model, response) {
					// If the login was successful set the user for the whole
					// application.
					// Also do post-successful login stuff, e.g. redirect to previous
					// page.
					_self.userDetails = model;
					console.log("branch INFO pre: " + model);
					if (model.get("id")) {
						_self.createCookie("branch", _self.userDetails.get("metadata")["branch"], 1);
						$("#header_branch").html(_self.userDetails.get("metadata")["branch"]);
						_self.createCookie("branchDescription", _self.userDetails.get("metadata")["branchDescription"], 1);
						Calipso.vent.trigger('session:created', _self.userDetails);

						//TODO move this

					}
					// login failed, show error
					else {
						// todo: show marionette/form error, clear fields
						window.alert("Invalid credentials!");
					}
				},

				// Generic error, show an alert.
				error : function(model, response) {
					alert("Authentication failed!");
				}

			});

		},

		// Attempt to load the user using the "remember me" cookie token, if any
		// exists.
		// The cookie should not be accessible by js. Here we let the server pick
		// it up
		// by itself and return the user details if appropriate
		load : function() {
			var _self = this;
			// Backbone.methodOverride = true;
			new Calipso.model.UserDetailsModel().fetch({
				async : false,
				url : baseUrl + "/api-auth/userDetails/remembered",
				success : function(model, response, options) {
					//if (model.id) {
					_self.userDetails = model;

					//}
				}
			});

		},
		// Logout the user here and on the server side.
		destroy : function() {
			if (this.userDetails) {
				this.userDetails.url = baseUrl + "/api-auth/userDetails/logout";
				this.userDetails.save({
					success : function(model, response) {
						this.userDetails = model;
						Calipso.vent.trigger("session:destroy", this.userDetails);
					},
					error : function() {
						// TODO: have constants defined by dev.properties > calipso.properties > index.jsp
						this.deleteCookie("JSESSIONID");
						this.deleteCookie("calipso-sso");
						this.Calipso.vent.trigger("session:destroy", this.userDetails);
					}
				});
				this.userDetails.clear();
				this.userDetails = null;
			}
		},
		getBaseUrl : function() {
			return baseUrl;
		}

	});

	Calipso.session = new Calipso.util.Session()

	// AMD define happens at the end for compatibility with AMD loaders
	// that don't enforce next-turn semantics on modules.

	return Calipso;

});
