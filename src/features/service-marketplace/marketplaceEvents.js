const marketplaceChangeListeners = new Set()

export function notifyBusinessMarketplaceChanged(businessId) {
  marketplaceChangeListeners.forEach((listener) => listener(businessId))
}

export function subscribeToBusinessMarketplaceChanges(listener) {
  marketplaceChangeListeners.add(listener)
  return () => marketplaceChangeListeners.delete(listener)
}

const customerMarketplaceChangeListeners = new Set()

export function notifyCustomerMarketplaceChanged(customerId) {
  customerMarketplaceChangeListeners.forEach((listener) => listener(customerId))
}

export function subscribeToCustomerMarketplaceChanges(listener) {
  customerMarketplaceChangeListeners.add(listener)
  return () => customerMarketplaceChangeListeners.delete(listener)
}
