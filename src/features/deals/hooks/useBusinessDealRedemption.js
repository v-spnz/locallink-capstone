import { useCallback, useEffect, useRef, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import {
  fetchBusinessDealRedemptions,
  lookupBusinessDealClaim,
  redeemBusinessDealClaim,
  validateBusinessDealRedemptionCode,
} from '../api/businessDealRedemptions'
import { getDealRedemptionErrorMessage } from '../redemptionError'
import {
  formatClaimReference,
  isCompleteClaimReference,
  normaliseClaimReference,
} from '../claimReference'
import {
  formatRedemptionCode,
  isCompleteRedemptionCode,
  normaliseRedemptionCode,
} from '../redemptionCode'

export default function useBusinessDealRedemption({ loadRecords = true } = {}) {
  const { business } = useBusiness()
  const [code, setCode] = useState('')
  const [validatedClaim, setValidatedClaim] = useState(null)
  const [completedRedemption, setCompletedRedemption] = useState(null)
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [claimLookupReference, setClaimLookupReference] = useState('')
  const [claimLookupResult, setClaimLookupResult] = useState(null)
  const [claimLookupError, setClaimLookupError] = useState('')
  const [redemptions, setRedemptions] = useState([])
  const [isValidating, setIsValidating] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(loadRecords)
  const [isLookingUpClaim, setIsLookingUpClaim] = useState(false)
  const validationInProgressRef = useRef(false)
  const redemptionInProgressRef = useRef(false)

  const loadRedemptions = useCallback(async () => {
    if (!loadRecords) {
      setIsHistoryLoading(false)
      return
    }

    setIsHistoryLoading(true)
    setHistoryError('')
    try {
      setRedemptions(await fetchBusinessDealRedemptions(business.id))
    } catch (loadError) {
      console.error('Unable to load deal redemptions.', loadError)
      setHistoryError('Unable to load recent redemption records.')
    } finally {
      setIsHistoryLoading(false)
    }
  }, [business.id, loadRecords])

  useEffect(() => {
    if (!loadRecords) return undefined
    const loadTimer = window.setTimeout(loadRedemptions, 0)
    return () => window.clearTimeout(loadTimer)
  }, [loadRecords, loadRedemptions])

  function updateCode(value) {
    setCode(formatRedemptionCode(value))
    setValidatedClaim(null)
    setCompletedRedemption(null)
    setError('')
  }

  const validateCode = useCallback(
    async (value = code) => {
      if (validationInProgressRef.current) return false

      const normalizedCode = normaliseRedemptionCode(value)
      setCode(formatRedemptionCode(normalizedCode))
      setValidatedClaim(null)
      setCompletedRedemption(null)
      setError('')

      if (!isCompleteRedemptionCode(normalizedCode)) {
        setError('Enter the complete 12-character redemption code.')
        return false
      }

      validationInProgressRef.current = true
      setIsValidating(true)
      try {
        const claim = await validateBusinessDealRedemptionCode(normalizedCode)
        setValidatedClaim(claim)
        return true
      } catch (validationError) {
        console.error('Unable to validate deal claim.', validationError)

        if (validationError.message?.includes('already been redeemed')) {
          try {
            const foundClaim = await lookupBusinessDealClaim(normalizedCode)
            setClaimLookupReference(foundClaim.claimReference)
            setClaimLookupResult(foundClaim)
            setClaimLookupError('')
            return true
          } catch (lookupError) {
            console.error('Unable to retrieve redeemed claim.', lookupError)
          }
        }

        setError(getDealRedemptionErrorMessage(validationError))
        return false
      } finally {
        validationInProgressRef.current = false
        setIsValidating(false)
      }
    },
    [code],
  )

  function handleValidate(event) {
    event.preventDefault()
    validateCode()
  }

  async function handleScannedCode(value) {
    const normalizedCode = normaliseRedemptionCode(value)
    setCode(formatRedemptionCode(normalizedCode))
    return validateCode(normalizedCode)
  }

  function updateClaimLookupReference(value) {
    setClaimLookupReference(formatClaimReference(value))
    setClaimLookupResult(null)
    setClaimLookupError('')
  }

  const lookupClaim = useCallback(
    async (value = claimLookupReference) => {
      const normalizedReference = normaliseClaimReference(value)
      setClaimLookupReference(formatClaimReference(normalizedReference))
      setClaimLookupResult(null)
      setClaimLookupError('')

      if (!isCompleteClaimReference(normalizedReference)) {
        setClaimLookupError('Enter the complete claim reference.')
        return false
      }

      setIsLookingUpClaim(true)
      try {
        const foundClaim = await lookupBusinessDealClaim(normalizedReference)
        setClaimLookupResult(foundClaim)
        return true
      } catch (lookupError) {
        console.error('Unable to find deal claim.', lookupError)
        setClaimLookupError(
          lookupError.message?.includes('another business')
            ? 'This claim belongs to another business.'
            : 'No claim was found with that reference.',
        )
        return false
      } finally {
        setIsLookingUpClaim(false)
      }
    },
    [claimLookupReference],
  )

  function handleClaimLookup(event) {
    event.preventDefault()
    lookupClaim()
  }

  function selectClaimRecord(claimRecord) {
    setClaimLookupReference(claimRecord.claimReference)
    setClaimLookupResult(claimRecord)
    setClaimLookupError('')
  }

  function clearClaimLookup() {
    setClaimLookupReference('')
    setClaimLookupResult(null)
    setClaimLookupError('')
  }

  async function handleConfirmRedemption() {
    if (!validatedClaim || redemptionInProgressRef.current) return false

    redemptionInProgressRef.current = true
    setIsRedeeming(true)
    setError('')
    try {
      const redemption = await redeemBusinessDealClaim(
        validatedClaim.redemptionCode,
      )
      setCompletedRedemption(redemption)
      setValidatedClaim((current) => ({
        ...current,
        redeemedAt: redemption.redeemedAt,
      }))
      if (loadRecords) await loadRedemptions()
      return true
    } catch (redemptionError) {
      console.error('Unable to redeem deal claim.', redemptionError)
      setValidatedClaim(null)
      setError(getDealRedemptionErrorMessage(redemptionError))
      return false
    } finally {
      redemptionInProgressRef.current = false
      setIsRedeeming(false)
    }
  }

  function resetRedemption() {
    setCode('')
    setValidatedClaim(null)
    setCompletedRedemption(null)
    setError('')
  }

  return {
    code,
    validatedClaim,
    completedRedemption,
    error,
    historyError,
    claimLookupReference,
    claimLookupResult,
    claimLookupError,
    redemptions,
    isValidating,
    isRedeeming,
    isHistoryLoading,
    isLookingUpClaim,
    updateCode,
    updateClaimLookupReference,
    handleValidate,
    handleClaimLookup,
    lookupClaim,
    handleScannedCode,
    handleConfirmRedemption,
    resetRedemption,
    selectClaimRecord,
    clearClaimLookup,
    reloadRedemptions: loadRedemptions,
  }
}
