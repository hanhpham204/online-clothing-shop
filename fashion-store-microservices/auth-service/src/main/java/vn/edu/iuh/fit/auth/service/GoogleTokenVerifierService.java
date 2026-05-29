package vn.edu.iuh.fit.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.common.exception.BusinessException;

import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
public class GoogleTokenVerifierService {
    @Value("${app.google.client-id:}")
    private String googleClientId;

    private GoogleIdTokenVerifier verifier;

    @PostConstruct
    void init() {
        if (googleClientId == null || googleClientId.isBlank()) {
            return;
        }
        verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    public GoogleIdToken.Payload verify(String idTokenString) {
        if (verifier == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "GOOGLE_NOT_CONFIGURED", "Google login is not configured");
        }
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new BusinessException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Invalid Google ID token");
            }
            return idToken.getPayload();
        } catch (GeneralSecurityException | java.io.IOException ex) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Cannot verify Google ID token");
        }
    }
}
