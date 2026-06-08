package com.bidflow.security;

import com.bidflow.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AuthHelper {

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        }
        return null;
    }

    public boolean hasRole(String... roles) {
        User user = getCurrentUser();
        if (user == null) return false;
        for (String role : roles) {
            if (role.equalsIgnoreCase(user.getRole())) return true;
        }
        return false;
    }
}
