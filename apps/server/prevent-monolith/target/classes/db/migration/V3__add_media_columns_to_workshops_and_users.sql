ALTER TABLE workshops
    ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS sidebar_image_url VARCHAR(500);

ALTER TABLE auth_users
    ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500);
