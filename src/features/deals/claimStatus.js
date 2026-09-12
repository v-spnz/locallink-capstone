export function isClaimActive(claim, now = new Date()) {
  if (!claim) return false
  if (claim.redeemed_at) return false
  if (claim.status === 'ended_early') return false
  if (!claim.expires_at) return false
  return new Date(claim.expires_at) > now
}
