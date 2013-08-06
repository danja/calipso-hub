/**
 * Copyright (c) 2007 - 2013 www.Abiss.gr
 *
 * This file is part of Calipso, a software platform by www.Abiss.gr.
 *
 * Calipso is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Calipso is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser Public License
 * along with Calipso. If not, see http://www.gnu.org/licenses/lgpl-3.0.txt
 */
/**
 * 
 */
package gr.abiss.calipso.jpasearch.data;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
/**
 * An implementation of PageRequest that holds all request parameters as a Map
 * provided by 
 * {@link http://static.springsource.org/spring/docs/3.2.x/javadoc-api/org/springframework/web/context/request/WebRequest.html#getParameterMap()}
 */
public class ParameterMapBackedPageRequest extends PageRequest {

	private static final long serialVersionUID = -752023352147402776L;

	private static final Logger LOGGER = LoggerFactory.getLogger(ParameterMapBackedPageRequest.class);

	private Map<String, String[]> parameterMap = null;

	/**
	 * 
	 * @param parameterMap
	 * @param page
	 * @param size
	 */
	public ParameterMapBackedPageRequest(Map<String, String[]> parameterMap, int page, int size) {
		super(page, size);
		this.parameterMap = parameterMap;
	}

	/**
	 * 
	 * @param parameterMap
	 * @param page
	 * @param size
	 * @param sort
	 */
	public ParameterMapBackedPageRequest(Map<String, String[]> parameterMap, int page, int size, Sort sort) {
		super(page, size, sort);
		this.parameterMap = parameterMap;
	}

	/**
	 * 
	 * @param parameterMap
	 * @param page
	 * @param size
	 * @param direction
	 * @param properties
	 */
	public ParameterMapBackedPageRequest(Map<String, String[]> parameterMap, int page, int size, Direction direction, String... properties) {
		super(page, size, direction, properties);
		this.parameterMap = parameterMap;
	}

	public Map<String, String[]> getParameterMap() {
		return parameterMap;
	}

	public void setParameterMap(Map<String, String[]> parameterMap) {
		this.parameterMap = parameterMap;
	}
}
