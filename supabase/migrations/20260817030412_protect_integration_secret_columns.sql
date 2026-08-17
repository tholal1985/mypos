/*
  # Keep integration secrets out of the browser

  1. Problem
     `api_connectors.credentials` holds third-party API keys and
     `woocommerce_settings.consumer_secret` holds the store secret. Both screens read
     their table with `select('*')`, so those secrets were sent to every business
     member's browser even though neither screen displays them.

  2. Changes
     - Revokes table-wide SELECT on `api_connectors` and `woocommerce_settings` from
       `anon` and `authenticated`, then re-grants SELECT on every column EXCEPT the
       secret one. The application queries have been narrowed to match, so all data the
       interface actually shows is still readable.
     - Writing the secrets is unchanged: INSERT and UPDATE still cover every column, so
       saving a key or a consumer secret continues to work. They simply cannot be read
       back out.

  3. Security
     - Stored integration credentials become write-only from the client's point of view.
*/

REVOKE SELECT ON api_connectors FROM anon, authenticated;
GRANT SELECT (
  id, business_id, name, provider, api_url, auth_type, status, last_sync_at,
  created_at, updated_at
) ON api_connectors TO authenticated;

REVOKE SELECT ON woocommerce_settings FROM anon, authenticated;
GRANT SELECT (
  id, business_id, store_url, consumer_key, auto_sync, sync_interval, status,
  last_sync_at, created_at, updated_at
) ON woocommerce_settings TO authenticated;
