package com.ruralops.platform.test;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/secure/ping")
    public String ping() {
        return "Authenticated request successful";
    }
}