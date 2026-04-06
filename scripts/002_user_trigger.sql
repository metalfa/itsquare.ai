-- Auto-create user profile and organization on signup
-- This runs with security definer privileges to bypass RLS during signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new organization for the user if they don't have one
  -- In the future, users can be invited to existing orgs
  INSERT INTO public.organizations (name)
  VALUES (
    COALESCE(
      NEW.raw_user_meta_data ->> 'company_name',
      SPLIT_PART(NEW.email, '@', 2) -- Use email domain as default org name
    )
  )
  RETURNING id INTO new_org_id;

  -- Create the user profile linked to the new organization
  INSERT INTO public.users (id, org_id, email, full_name, role)
  VALUES (
    NEW.id,
    new_org_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    'owner' -- First user is always the owner
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name);

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
