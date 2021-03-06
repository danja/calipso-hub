package gr.abiss.calipso.service.impl.acl;

import gr.abiss.calipso.jpasearch.service.impl.AbstractAclAwareServiceImpl;
import gr.abiss.calipso.model.acl.AclSid;
import gr.abiss.calipso.repository.acl.AclSidRepository;
import gr.abiss.calipso.service.acl.AclSidService;

import javax.inject.Inject;
import javax.inject.Named;

import org.springframework.transaction.annotation.Transactional;

@Named("aclSidService")
@Transactional(readOnly = true)
public class AclSidServiceImpl extends
		AbstractAclAwareServiceImpl<AclSid, Long, AclSidRepository> implements
		AclSidService {

}

