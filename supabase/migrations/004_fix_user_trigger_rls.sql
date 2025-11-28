-- Fix the handle_new_user trigger to bypass RLS
-- The issue: RLS policies block the trigger from inserting into users table
-- Solution: Make the function SECURITY DEFINER and grant it permission to bypass RLS

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- Run as the function owner (bypasses RLS)
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, username, display_name, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
        NEW.email
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- If user already exists (e.g., from a failed previous attempt), ignore
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
