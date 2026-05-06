package com.voguestore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class VogueStoreApplication {
    public static void main(String[] args) {
        SpringApplication.run(VogueStoreApplication.class, args);
    }
}
