/**
 * Minimal globals for Supabase Edge Functions (Deno runtime). Used by editors/TS when
 * the Deno extension is not enabled; does not ship to the runtime.
 */

declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
  function serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void;
}
