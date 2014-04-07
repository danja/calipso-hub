/*
 * Copyright (c) 2007 - 2013 www.Abiss.gr
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
	var Backbone = require('backbone'),
		Marionette = require('marionette'),
		BackboneForm = require('backbone-forms'), 
		GenericFormView = require('view/GenericFormView'), 
		tmpl = require('hbs!template/GenericFormView');

	var GenericFormTabContentView = GenericFormView.extend({
		className : "tab-pane active fade in",
		// dynamically set the id
		initialize: function(){
			GenericFormView.prototype.initialize.apply(this, arguments);
			this.getTypeName() = "GenericFormTabContentView";
		  this.$el.prop("id", "tab-"+this.model.get("id"));
		  this.formTemplate = _.template('\
		    <form class="form-vertical" role="form" data-fieldsets></form>\
		  ');

		},
	},
	{
		getTypeName: function(){return "GenericFormTabContentView"}
	});
});
