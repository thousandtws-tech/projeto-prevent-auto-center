UPDATE auth_users
SET email_verified_at = COALESCE(created_at, NOW())
WHERE email_verified_at IS NULL;

