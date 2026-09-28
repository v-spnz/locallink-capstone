import { useEffect, useState } from 'react'
import { fetchBusinessesInSavedSuburb } from '../../../features/location/api/locations'

export default function useSuburbDeals() {
  const [businesses, setBusinesses] = useState([])

  useEffect(() => {
    let active = true

    fetchBusinessesInSavedSuburb('All')
      .then((results) => {
        if (active) setBusinesses(results ?? [])
      })
      .catch((error) => {
        console.error('Unable to load deals for search.', error)
      })

    return () => {
      active = false
    }
  }, [])

  return businesses
}