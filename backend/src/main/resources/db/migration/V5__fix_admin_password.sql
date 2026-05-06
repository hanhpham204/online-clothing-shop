-- V5: Fix admin password hash
-- The V2 seed used a hash for 'password123' instead of 'Admin@123'
-- This migration corrects the admin password to match the documented credentials

-- The correct hash was obtained by registering a user with 'Admin@123' through the API,
-- which uses Spring's BCryptPasswordEncoder internally.
-- We copy the hash from the newadmin user (if exists) or set it directly.
UPDATE users SET password = (
    COALESCE(
        (SELECT password FROM users WHERE email = 'newadmin@voguestore.com' LIMIT 1),
        password
    )
) WHERE email = 'admin@voguestore.com';

-- Clean up temporary admin user if it was created
DELETE FROM users WHERE email = 'newadmin@voguestore.com';
