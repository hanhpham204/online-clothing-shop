package vn.edu.iuh.fit.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.iuh.fit.backend.entity.Role;
import vn.edu.iuh.fit.backend.repository.RoleRepository;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    @Transactional
    public CommandLineRunner seedRoles(RoleRepository roleRepository) {
        return args -> {
            List<String> roles = List.of("USER", "ADMIN");
            for (String roleName : roles) {
                roleRepository.findByRoleName(roleName).orElseGet(() -> {
                    Role role = new Role();
                    role.setRoleName(roleName);
                    return roleRepository.save(role);
                });
            }
        };
    }
}
