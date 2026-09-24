import { useRef, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import {
  addLoyaltyProgress,
  lookupBusinessLoyaltyRecord,
  redeemLoyaltyReward,
} from '../api/loyaltyCustomerRecords'
import {
  formatLoyaltyLookupCode,
  isCompleteLoyaltyLookupCode,
  normaliseLoyaltyLookupCode,
} from '../loyaltyIdentifier'

export default function useLoyaltyCustomerLookup() {
  const { business } = useBusiness()
  const [identifier, setIdentifier] = useState('')
  const [record, setRecord] = useState(null)
  const [error, setError] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isAddingStamp, setIsAddingStamp] = useState(false)
  const [stampError, setStampError] = useState('')
  const [stampSuccess, setStampSuccess] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [redeemError, setRedeemError] = useState('')
  const [redeemSuccess, setRedeemSuccess] = useState(false)
  const lookupInProgressRef = useRef(false)

  function updateIdentifier(value) {
    setIdentifier(formatLoyaltyLookupCode(value))
    setRecord(null)
    setError('')
    setStampError('')
    setStampSuccess(false)
    setRedeemError('')
    setRedeemSuccess(false)
  }

  async function lookupRecord(value = identifier) {
    if (lookupInProgressRef.current) return false

    const normalised = normaliseLoyaltyLookupCode(value)
    setIdentifier(formatLoyaltyLookupCode(normalised))
    setRecord(null)
    setError('')
    setStampError('')
    setStampSuccess(false)
    setRedeemError('')
    setRedeemSuccess(false)

    if (!isCompleteLoyaltyLookupCode(normalised)) {
      setError('Enter the complete customer loyalty code.')
      return false
    }

    lookupInProgressRef.current = true
    setIsLookingUp(true)
    try {
      const result = await lookupBusinessLoyaltyRecord(
        business.id,
        formatLoyaltyLookupCode(normalised),
      )
      setRecord(result)
      return true
    } catch (lookupError) {
      console.error('Unable to identify customer loyalty record.', lookupError)
      setError('No loyalty record was found for this business.')
      return false
    } finally {
      lookupInProgressRef.current = false
      setIsLookingUp(false)
    }
  }

  function handleLookup(event) {
    event.preventDefault()
    void lookupRecord()
  }

  async function handleScannedCode(value) {
    return lookupRecord(value)
  }

  async function addStamp(amount = 1) {
    if (!record || isAddingStamp) return false
    setIsAddingStamp(true)
    setStampError('')
    setStampSuccess(false)
    try {
      const updated = await addLoyaltyProgress(record.id, amount)
      setRecord(updated)
      setStampSuccess(true)
      return true
    } catch (stampErr) {
      console.error('Unable to add loyalty progress.', stampErr)
      setStampError('Unable to add this stamp. Please try again.')
      return false
    } finally {
      setIsAddingStamp(false)
    }
  }

  async function redeemReward() {
    if (!record || isRedeeming) return false
    setIsRedeeming(true)
    setRedeemError('')
    setRedeemSuccess(false)
    try {
      const updated = await redeemLoyaltyReward(record.id)
      setRecord(updated)
      setRedeemSuccess(true)
      return true
    } catch (redeemErr) {
      console.error('Unable to redeem loyalty reward.', redeemErr)
      setRedeemError('Unable to redeem this reward. Please try again.')
      return false
    } finally {
      setIsRedeeming(false)
    }
  }

  function clearLookup() {
    setIdentifier('')
    setRecord(null)
    setError('')
    setStampError('')
    setStampSuccess(false)
    setRedeemError('')
    setRedeemSuccess(false)
  }

  return {
    identifier,
    record,
    error,
    isLookingUp,
    isAddingStamp,
    stampError,
    stampSuccess,
    isRedeeming,
    redeemError,
    redeemSuccess,
    updateIdentifier,
    handleLookup,
    handleScannedCode,
    addStamp,
    redeemReward,
    clearLookup,
  }
}
