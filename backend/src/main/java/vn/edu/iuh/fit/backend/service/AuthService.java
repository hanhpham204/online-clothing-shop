package vn.edu.iuh.fit.backend.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.iuh.fit.backend.dto.auth.AuthResponse;
import vn.edu.iuh.fit.backend.dto.auth.LoginRequest;
import vn.edu.iuh.fit.backend.dto.auth.RegisterRequest;
import vn.edu.iuh.fit.backend.entity.Role;
import vn.edu.iuh.fit.backend.entity.User;
import vn.edu.iuh.fit.backend.repository.RoleRepository;
import vn.edu.iuh.fit.backend.repository.UserRepository;
import vn.edu.iuh.fit.backend.security.CustomUserDetailsService;
import vn.edu.iuh.fit.backend.security.JwtService;

import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class AuthService {

    public static final String DEFAULT_ROLE = "USER";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            CustomUserDetailsService userDetailsService,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(BAD_REQUEST, "Email already exists");
        }

        Role role = roleRepository.findByRoleName(DEFAULT_ROLE)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Default role USER does not exist"));

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setName(request.name().trim());
        user.setRole(role);
        user.setActive(true);
        User savedUser = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String token = jwtService.generateToken(userDetails, Map.of("role", role.getRoleName(), "userId", savedUser.getId()));

        return new AuthResponse(
                token,
                "Bearer",
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getName(),
                role.getRoleName()
        );
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtService.generateToken(
                userDetails,
                Map.of("role", user.getRole().getRoleName(), "userId", user.getId())
        );

        return new AuthResponse(
                token,
                "Bearer",
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole().getRoleName()
        );
    }
}
