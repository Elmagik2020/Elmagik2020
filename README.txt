ELmagik Cool website – connected admin package

Upload the complete folder to the same hosting project as the current website. Keep index.html, admin.js, and assets/ together.

Supabase is already configured for the existing project using its public publishable key. Never add a service_role or secret key to frontend files.

Admin access is restricted by the public.admins table and RLS. Customer reviews are submitted as pending and require admin approval before publication. Site settings and reviews are delivered to visitors through Supabase Realtime.

The QR image points to the URL embedded when it was created; regenerate it if your public website URL has changed.

The three featured work images are now editable individually from the admin panel: replace image, edit caption, and show/hide. Their default local asset images remain as fallbacks. The responsive gallery keeps its configured column count consistently across all rows.


Password management: administrators can change their password while signed in or request a Supabase recovery email. The login field accepts the linked administrator phone number as an alias for the configured Gmail account; authentication remains Supabase email/password. Configure the deployed Vercel URL in Supabase Authentication > URL Configuration and ensure email delivery is enabled.
