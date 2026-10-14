# Connect Paddock to Supabase

This branch builds on the business-planner branch (PR #1). Merge the planner first, then this branch.

1. Create a Supabase project for Paddock.
2. Run `supabase/migrations/202610140001_workspace.sql` in that project's SQL editor once. It creates per-user, versioned collections and row-level security policies.
3. In Authentication, create your owner account with email and password. Public sign-up is not part of Paddock; disable new-user sign-ups for this private workspace.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to your local `.env.local` and the intended Vercel environments. Use the publishable key, never a service-role or secret key.
5. Redeploy and sign in. Cloud collections initially start empty.
6. On the browser containing your previous Paddock data, use Settings to download backups. Review them, then import each browser collection into its empty cloud collection. Browser records are not automatically uploaded or deleted. The initial demo project/client records may be included in a browser backup.
7. Sign in on a second device and verify the same records load. Changes from another device are loaded on refresh, not streamed live.

## Storage behavior

Without both environment variables, Paddock continues using browser storage. With both configured, authenticated Supabase storage is required; errors never silently switch to browser storage. Each collection is saved sequentially with an expected revision. A stale device fails with a visible message rather than overwriting another device's newer collection. Download the local working copy before refreshing after a save failure. A pending-save/failed-save navigation warning is provided for page unloads; always wait for saving to finish before signing out.

The schema stores projects (including their tasks/milestones), clients, and invoices as JSON arrays. This preserves the existing UI model and is appropriate for a small owner-operated workspace; multi-user collaboration and granular relational reporting would require a later schema migration.

## Verify before production

Run `npm run lint`, `npm test`, and `npm run build`. With a configured test project, verify login/logout, failed login, create/update/delete persistence on refresh, second-device access, empty-cloud imports, concurrent-edit conflict handling, and inability of a second account or an unauthenticated request to read the owner's rows. The automated cloud tests use a mock transport; they do not validate a deployed Supabase project or execute the SQL migration.

## Original document files

Run `supabase/migrations/202610140002_document_storage.sql` in the Supabase SQL editor before enabling original-file saves. The script is safe to rerun. It creates the private `project-documents` bucket with a 3 MB file limit and owner-folder read/upload policies. No new key or Vercel environment variable is needed.

On Documents, select a project, check only the fields and invoices to apply, and choose whether to save the original file and source text. Existing-project fields start unchecked. Scanned PDFs can be saved without extraction: review the file, select the existing project, and keep only the original-file attachment checked. Project Documents includes a download button; cloud downloads use a short-lived signed URL.

Without cloud configuration, original files use IndexedDB in the current browser. They do not sync between devices or appear in JSON backups; clearing browser storage removes these files. Cloud original files are stored separately from workspace JSON backups. The app finishes an original-file upload before applying any record changes. A later collection-save failure is shown by the workspace saving indicator; a successful upload alone does not guarantee that its project reference was saved. Wait for workspace saving to finish before navigating away.

Storage transport tests are mocked. Validate the SQL policies in your Supabase project by checking that unauthenticated users and a different account cannot download the owner's files, then test uploading and downloading from two signed-in devices.
