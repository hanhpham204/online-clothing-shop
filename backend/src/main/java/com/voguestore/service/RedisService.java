package com.voguestore.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisService {

    private static final Logger logger = LoggerFactory.getLogger(RedisService.class);

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String TOKEN_BLACKLIST_PREFIX = "token:blacklist:";
    private static final String LOGIN_ATTEMPT_PREFIX = "auth:login-attempt:";
    private static final String LOGIN_LOCK_PREFIX = "auth:login-lock:";
    private static final String SEARCH_CACHE_PREFIX = "search:results:";
    private static final String SUGGEST_CACHE_PREFIX = "search:suggest:";
    private static final String SEARCH_HISTORY_PREFIX = "search:history:";
    private static final int MAX_HISTORY_SIZE = 10;

    // ═══════════════════════════════════════════
    // TOKEN BLACKLIST
    // ═══════════════════════════════════════════

    public void blacklistToken(String jti, long expirationMs) {
        long ttl = expirationMs - System.currentTimeMillis();
        if (ttl > 0) {
            redisTemplate.opsForValue().set(
                    TOKEN_BLACKLIST_PREFIX + jti,
                    "blacklisted",
                    ttl,
                    TimeUnit.MILLISECONDS
            );
        }
    }

    public boolean isTokenBlacklisted(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(TOKEN_BLACKLIST_PREFIX + jti));
    }

    public long incrementLoginAttempts(String key, long windowSeconds) {
        String redisKey = LOGIN_ATTEMPT_PREFIX + key;
        Long attempts = redisTemplate.opsForValue().increment(redisKey);
        if (attempts != null && attempts == 1L) {
            redisTemplate.expire(redisKey, windowSeconds, TimeUnit.SECONDS);
        }
        return attempts == null ? 0 : attempts;
    }

    public void lockLogin(String key, long lockDurationSeconds) {
        redisTemplate.opsForValue().set(LOGIN_LOCK_PREFIX + key, "locked", lockDurationSeconds, TimeUnit.SECONDS);
    }

    public boolean isLoginLocked(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(LOGIN_LOCK_PREFIX + key));
    }

    public void resetLoginAttempts(String key) {
        redisTemplate.delete(LOGIN_ATTEMPT_PREFIX + key);
        redisTemplate.delete(LOGIN_LOCK_PREFIX + key);
    }

    // ═══════════════════════════════════════════
    // GENERIC CACHE
    // ═══════════════════════════════════════════

    public void cacheValue(String key, Object value, long ttl, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, ttl, unit);
    }

    public Object getCachedValue(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void deleteCache(String key) {
        redisTemplate.delete(key);
    }

    public void deleteCacheByPattern(String pattern) {
        var keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    // ═══════════════════════════════════════════
    // SEARCH RESULT CACHE (JSON-serialized)
    // ═══════════════════════════════════════════

    /**
     * Cache search results as JSON string with short TTL.
     */
    public void cacheSearchResults(String cacheKey, Object results, long ttlSeconds) {
        try {
            String json = objectMapper.writeValueAsString(results);
            redisTemplate.opsForValue().set(
                    SEARCH_CACHE_PREFIX + cacheKey,
                    json,
                    ttlSeconds,
                    TimeUnit.SECONDS
            );
        } catch (JsonProcessingException e) {
            logger.warn("Failed to cache search results: {}", e.getMessage());
        }
    }

    /**
     * Get cached search results, deserialized to target type.
     */
    public <T> T getCachedSearchResults(String cacheKey, TypeReference<T> typeRef) {
        Object raw = redisTemplate.opsForValue().get(SEARCH_CACHE_PREFIX + cacheKey);
        if (raw == null) return null;
        try {
            String json = raw instanceof String ? (String) raw : objectMapper.writeValueAsString(raw);
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            logger.warn("Failed to read cached search results: {}", e.getMessage());
            return null;
        }
    }

    // ═══════════════════════════════════════════
    // SUGGESTION CACHE
    // ═══════════════════════════════════════════

    public void cacheSuggestions(String keyword, List<String> suggestions) {
        try {
            String json = objectMapper.writeValueAsString(suggestions);
            redisTemplate.opsForValue().set(
                    SUGGEST_CACHE_PREFIX + keyword.toLowerCase().trim(),
                    json,
                    300, // 5 minutes TTL
                    TimeUnit.SECONDS
            );
        } catch (JsonProcessingException e) {
            logger.warn("Failed to cache suggestions: {}", e.getMessage());
        }
    }

    public List<String> getCachedSuggestions(String keyword) {
        Object raw = redisTemplate.opsForValue().get(SUGGEST_CACHE_PREFIX + keyword.toLowerCase().trim());
        if (raw == null) return null;
        try {
            String json = raw instanceof String ? (String) raw : objectMapper.writeValueAsString(raw);
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            logger.warn("Failed to read cached suggestions: {}", e.getMessage());
            return null;
        }
    }

    // ═══════════════════════════════════════════
    // SEARCH HISTORY (per user, stored as Redis List)
    // ═══════════════════════════════════════════

    /**
     * Add a search keyword to user's history (most recent first, max 10).
     */
    public void addSearchHistory(Long userId, String keyword) {
        String key = SEARCH_HISTORY_PREFIX + userId;
        String normalizedKeyword = keyword.trim();
        if (normalizedKeyword.isEmpty()) return;

        // Remove duplicate if exists, then push to front
        redisTemplate.opsForList().remove(key, 0, normalizedKeyword);
        redisTemplate.opsForList().leftPush(key, normalizedKeyword);
        // Trim to keep only last N entries
        redisTemplate.opsForList().trim(key, 0, MAX_HISTORY_SIZE - 1);
        // Set TTL for history (30 days)
        redisTemplate.expire(key, 30, TimeUnit.DAYS);
    }

    /**
     * Get user's search history (most recent first).
     */
    public List<String> getSearchHistory(Long userId) {
        String key = SEARCH_HISTORY_PREFIX + userId;
        List<Object> raw = redisTemplate.opsForList().range(key, 0, MAX_HISTORY_SIZE - 1);
        if (raw == null) return Collections.emptyList();
        List<String> history = new ArrayList<>();
        for (Object item : raw) {
            history.add(item.toString());
        }
        return history;
    }

    /**
     * Clear user's search history.
     */
    public void clearSearchHistory(Long userId) {
        redisTemplate.delete(SEARCH_HISTORY_PREFIX + userId);
    }
}
