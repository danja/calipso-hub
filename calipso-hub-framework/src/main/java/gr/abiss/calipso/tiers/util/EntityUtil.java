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
package gr.abiss.calipso.tiers.util;

import gr.abiss.calipso.tiers.annotation.ModelRelatedResource;
import gr.abiss.calipso.tiers.annotation.ModelResource;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.data.domain.Persistable;

import javax.persistence.Entity;

import org.springframework.util.Assert;
import org.springframework.util.ReflectionUtils;

public class EntityUtil {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(EntityUtil.class);
	
	@SuppressWarnings("unchecked")
	public static <T> T getParentEntity(Object child){
        ModelRelatedResource anr = child.getClass().getAnnotation(ModelRelatedResource.class);
        Assert.notNull( anr, "Given child object has no @RelatedEntity annotation");
        Field field = ReflectionUtils.findField(child.getClass(), anr.parentProperty());
        field.setAccessible(true);
        Object parent = ReflectionUtils.getField(field, child);
        return (T) parent;
    }
    
    public static Set<BeanDefinition> findAnnotatedClasses(String scanPackage) {
        ClassPathScanningCandidateComponentProvider provider = createComponentScanner();
        return provider.findCandidateComponents(scanPackage);
    }
    
    public static ClassPathScanningCandidateComponentProvider createComponentScanner() {
        // Don't pull default filters (@Component, etc.):
        ClassPathScanningCandidateComponentProvider provider
                = new ClassPathScanningCandidateComponentProvider(false);
        provider.addIncludeFilter(new AnnotationTypeFilter(ModelResource.class));
        provider.addIncludeFilter(new AnnotationTypeFilter(ModelRelatedResource.class));
        return provider;
    }
    
    public static Class<?> getIdType(Class<?> modelType) {
    	Class<?> idType = null;
		Method testMethod = null;
        try {
			testMethod = modelType.getMethod("getId");
		} catch (Exception e) {
			LOGGER.error("Could not determine ID type", e);
		}
		if(testMethod != null){
			idType = testMethod.getReturnType();
		}
		return idType;
	}

}
