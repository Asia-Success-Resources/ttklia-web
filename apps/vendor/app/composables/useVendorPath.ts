/**
 * Builds a vendor API path for the current outlet: `products` → `/vendor-portal/o/{outlet}/products`
 * (doc 04, doc 32: vendor endpoints are under /api/v1/vendor-portal/o/{outlet}/…, routed to api-ops).
 * Returns null when there is no outlet in the path, so lists stay empty instead of calling a wrong URL.
 */
export function useVendorPath() {
  const { slug } = useWorkspace()
  return (path: string): string | null => (slug.value ? `/vendor-portal/o/${slug.value}/${path}` : null)
}
