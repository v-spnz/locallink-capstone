import { useEffect, useMemo, useState } from 'react'
import useAuth from '../../../auth/useAuth'
import loyaltyPrograms from '../../../data/loyaltyPrograms'
import { fetchRewardRedemptions, redeemLoyaltyReward } from '../api/loyaltyApi'

function getPercent(program) {
  if (program.type === 'stamp')
    return Math.round((program.stampsEarned / program.stampsRequired) * 100)
  return Math.round((program.points / program.pointsRequired) * 100)
}

export default function useLoyaltyPrograms() {
  const { user } = useAuth()
  const [tab, setTab] = useState('inprogress')
  const [search, setSearch] = useState('')
  const [programs, setPrograms] = useState(loyaltyPrograms)
  const [error, setError] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(null)

  useEffect(() => {
    let active = true

    async function loadRedemptions() {
      try {
        const redemptions = await fetchRewardRedemptions(user.id)
        if (!active) return
        const redemptionByProgramme = new Map(
          redemptions.map((item) => [item.mock_programme_id, item.redeemed_at]),
        )
        setPrograms(
          loyaltyPrograms.map((program) => {
            const redeemedAt = redemptionByProgramme.get(program.id)
            return redeemedAt
              ? { ...program, redeemed: true, completedOn: redeemedAt }
              : program
          }),
        )
      } catch {
        if (active) setError('Unable to load your saved redemptions right now.')
      }
    }

    loadRedemptions()
    return () => {
      active = false
    }
  }, [user.id])

  const totalPoints = useMemo(
    () =>
      programs.reduce(
        (sum, program) =>
          sum + (program.type === 'points' ? program.points : 0),
        0,
      ),
    [programs],
  )

  const filteredPrograms = programs.filter((program) =>
    program.business.toLowerCase().includes(search.toLowerCase()),
  )
  const inProgress = filteredPrograms
    .filter((program) => program.status === 'active')
    .sort((a, b) => getPercent(b) - getPercent(a))
  const completed = filteredPrograms
    .filter((program) => program.status === 'completed')
    .sort((a, b) => new Date(b.completedOn) - new Date(a.completedOn))

  async function handleRedeem(programId) {
    setError('')
    setIsRedeeming(programId)
    try {
      const redemption = await redeemLoyaltyReward(programId)
      setPrograms((previous) =>
        previous.map((program) =>
          program.id === programId
            ? {
                ...program,
                redeemed: true,
                completedOn: redemption.redeemed_at,
              }
            : program,
        ),
      )
    } catch {
      setError('Unable to redeem this reward. Please try again.')
    } finally {
      setIsRedeeming(null)
    }
  }

  return {
    tab,
    search,
    programs,
    totalPoints,
    inProgress,
    completed,
    list: tab === 'inprogress' ? inProgress : completed,
    error,
    isRedeeming,
    setTab,
    setSearch,
    handleRedeem,
  }
}
