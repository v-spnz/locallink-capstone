import { useContext } from 'react'
import BusinessContext from './BusinessContext'

export default function useBusiness() {
  const context = useContext(BusinessContext)

  if (context === undefined) {
    throw new Error('useBusiness must be used inside BusinessProvider')
  }

  return context
}
