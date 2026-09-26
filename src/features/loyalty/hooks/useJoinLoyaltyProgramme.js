import { useRef, useState } from 'react'
import { joinLoyaltyProgramme } from '../api/loyaltyApi'
import {
  formatJoinCode,
  isCompleteJoinCode,
  normaliseJoinCode,
} from '../joinCode'

export default function useJoinLoyaltyProgramme(onJoined) {
  const [code, setCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const joinInProgressRef = useRef(false)

  function updateCode(value) {
    setCode(formatJoinCode(value))
    setError('')
    setSuccess(false)
  }

  async function joinWithCode(value = code) {
    if (joinInProgressRef.current) return false

    const normalised = normaliseJoinCode(value)
    setCode(formatJoinCode(normalised))
    setError('')
    setSuccess(false)

    if (!isCompleteJoinCode(normalised)) {
      setError('Enter the complete join code.')
      return false
    }

    joinInProgressRef.current = true
    setIsJoining(true)
    try {
      const record = await joinLoyaltyProgramme(formatJoinCode(normalised))
      setSuccess(true)
      setCode('')
      onJoined?.(record)
      return true
    } catch (joinError) {
      console.error('Unable to join loyalty programme.', joinError)
      // Postgres RAISE EXCEPTION messages from join_loyalty_programme are
      // already human-readable (e.g. "No active loyalty programme matches
      // this code") — surface that directly instead of a hardcoded
      // generic string that hides what actually went wrong.
      setError(joinError?.message || 'No active programme matches this code.')
      return false
    } finally {
      joinInProgressRef.current = false
      setIsJoining(false)
    }
  }

  function handleJoin(event) {
    event.preventDefault()
    void joinWithCode()
  }

  async function handleScannedCode(value) {
    return joinWithCode(value)
  }

  return {
    code,
    isJoining,
    error,
    success,
    updateCode,
    handleJoin,
    handleScannedCode,
  }
}
