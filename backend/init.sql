-- Create database
CREATE DATABASE student_portal;

-- Switch to database (though init scripts are run before database creation, so this might not help)
-- \c student_portal;

-- But since the volume mounts this file, and the database doesn't exist yet, perhaps I need a different approach.

-- Let's try to create the user and database in the default postgres database
-- But this is mounting to the entrypoint, which might be tricky.

-- Alternatively, remove the database from .env and connect to default, or add a script to create it.
