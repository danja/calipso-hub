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
define(['marionette', 'calipso', 'controllers/MainController'], function (Marionette, Calipso, MainController) {

	return Marionette.AppRouter.extend({

		controller : new MainController(),

		appRoutes : {

			'' : 'home',
			'_=_' : 'toHome',
			'#_=_' : 'toHome',
			'home' : 'home',
			'login' : 'login',
			//'loginRegistered' : 'loginRegistered',
			'changePassword' : 'changePassword',
			'changePasswordWithToken/:username' : 'renderTokenPasswordChangeForm',
			'changePasswordWithToken/:username/:token' : 'renderTokenPasswordChangeForm',
			'logout' : 'logout',
			'register' : 'register',
			'myProfile' : 'myProfile',

			'page/:templateName' : 'templatePage',
			':mainRoutePart/reports' : 'mainNavigationReportRoute',
			':mainRoutePart/reports/' : 'mainNavigationReportRoute',
			':mainRoutePart/reports/?*queryString' : 'mainNavigationReportRoute',
			':mainRoutePartreports?*queryString' : 'mainNavigationReportRoute',

			':mainRoutePart' : 'mainNavigationSearchRoute',
			':mainRoutePart/' : 'mainNavigationSearchRoute',
			':mainRoutePart/?*queryString' : 'mainNavigationSearchRoute',
			':mainRoutePart?*queryString' : 'mainNavigationSearchRoute',
			':mainRoutePart/:modelId' : 'mainNavigationCrudRoute',
			'*path':  'notFoundRoute'
		}

	},
	{
	// static members
		getTypeName: function(){return "MainRouter"}
	});

});
