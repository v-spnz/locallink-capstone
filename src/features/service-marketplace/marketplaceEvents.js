const marketplaceChangeListeners = new Set()

export function notifyBusinessMarketplaceChanged(businessId) {
  marketplaceChangeListeners.forEach((listener) => listener(businessId))
}

export function subscribeToBusinessMarketplaceChanges(listener) {
  marketplaceChangeListeners.add(listener)
  return () => marketplaceChangeListeners.delete(listener)
}
