package com.ibm.websphere.samples.pbw.bean;

import jakarta.annotation.PostConstruct;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.inject.Inject;

import com.ibm.websphere.samples.pbw.utils.Util;

@Singleton
@Startup
public class PopulateDBBean {
    
    @Inject
    ResetDBBean dbBean;
    
    @PostConstruct
    public void initDB() {
        Util.debug("Initializing database...");
        dbBean.populateDB();
    }

}
