export function getDealRedemptionErrorMessage(error) {
  const message = String(error?.message ?? '')

  if (message.includes('another business')) {
    return 'This code belongs to a deal from another business.'
  }
  if (message.includes('already been redeemed')) {
    return 'This claim has already been redeemed.'
  }
  if (message.includes('window has expired')) {
    return 'This claim has expired and can no longer be redeemed.'
  }
  if (message.includes('not found')) {
    return 'This redemption code is invalid. Check the code and try again.'
  }

  return 'Unable to check this redemption code. Please try again.'
}
