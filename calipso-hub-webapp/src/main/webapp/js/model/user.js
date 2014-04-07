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
define([ 'model/generic-model', 'component/backgrid-edit-in-tab-button-cell', 'component/backgrid-view-in-tab-cell' ], 
		function(GenericModel, EditInTabCell, ViewInTabCell) {

	var templateNoLabel = _.template('\
			    <div class="form-group field-<%= key %>">\
			      <div class="col-sm-11">\
			        <span data-editor></span><p class="help-block" data-error></p><p class="help-block"><%= help %></p>\
			      </div>\
			    </div>\
			  ');
	var UserModel = GenericModel.extend({
		urlRoot : "/api/rest/users",
	},
	// static members
	{
		parent : GenericModel
	});


	/**
	 * Get the model class URL fragment corresponding this class
	 * @returns the URL path fragment as a string
	 */
	UserModel.prototype.getPathFragment = function() {
		return "users";
	}
	UserModel.prototype.getFormSchemas = function() {

		return {//
			userName : {
				"search" : {
					type : 'Text',
					template : templateNoLabel,
					editorAttrs : {
						placeholder : "Αριθμός Πελάτη"
					},
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
			},
		};
	
	}
	
	UserModel.prototype.getGridSchema = function() {
		return [ {
			name : "userName",
			label : "username",
			cell : ViewInTabCell,
			editable : false,
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
			editable : false,
		}, {
			name : "createdDate",
			label : "created",
			cell : "date",
			editable : false,
		}, {
			name : "edit",
			label : "",
			editable : false,
			cell : EditInTabCell
		} ];
	}

	return UserModel;
});