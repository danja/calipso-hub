/**
 *
 *
 * Copyright (c) 2007 - 2013 www.Abiss.gr
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package gr.abiss.calipso.userDetails.controller;

import gr.abiss.calipso.userDetails.service.UserDetailsService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.RequestMapping;




//@Controller
@RequestMapping(value = "/apiauth", produces = { "application/json", "application/xml" })
public class UserDetailsController extends AbstractUserDetailsController<UserDetailsService> {

	private static final Logger LOGGER = LoggerFactory.getLogger(UserDetailsController.class);


}
