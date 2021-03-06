/**
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
package gr.abiss.calipso.web.spring;

import java.io.Serializable;

import javax.inject.Named;

import gr.abiss.calipso.model.User;
import gr.abiss.calipso.userDetails.integration.LocalUser;
import gr.abiss.calipso.userDetails.integration.LocalUserService;
import gr.abiss.calipso.userDetails.model.ICalipsoUserDetails;
import gr.abiss.calipso.userDetails.service.UserDetailsService;
import gr.abiss.calipso.userDetails.util.SecurityUtil;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.AuditorAware;

public class AuditorBean implements AuditorAware<User> {
	private static final Logger LOGGER = LoggerFactory
			.getLogger(AuditorBean.class);

	private User currentAuditor;

	private UserDetailsService userDetailsService;
	

	@Autowired(required = true)
	@Qualifier("userDetailsService") // somehow required for CDI to work on 64bit JDK?
	public void setLocalUserService(
			UserDetailsService userDetailsService) {
		this.userDetailsService = userDetailsService;
	}

	@Override
	public User getCurrentAuditor() {
		if(currentAuditor == null){
			ICalipsoUserDetails userDetails = SecurityUtil.getPrincipal();
			if(userDetails != null){
				currentAuditor = new User(userDetails.getId());
			}
		}
		else{
			LOGGER.debug("getCurrentAuditor returns cached result");
		}
		return currentAuditor;
	}

	public void setCurrentAuditor(User currentAuditor) {
		this.currentAuditor = currentAuditor;
	}

}