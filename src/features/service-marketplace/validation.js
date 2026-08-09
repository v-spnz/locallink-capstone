import { CITIES, POSTED_DISTANCES, TRADE_CATEGORIES } from './constants'

export function validateJobRequest(values, suburbOptions) {
  const errors = {}
  const title = values.title.trim()
  const description = values.description.trim()
  const category = values.category.trim()
  const city = values.city.trim()
  const suburb = values.suburb.trim()
  const postedDistance = values.postedDistance.trim()

  if (!title) errors.title = 'Please enter a job title.'
  else if (title.length < 3)
    errors.title = 'Job title should be at least 3 characters long.'
  else if (title.length > 60)
    errors.title = 'Job title cannot exceed 60 characters.'

  if (!description) errors.description = 'Please enter a job description.'
  else if (description.length < 10)
    errors.description =
      'Please include at least 10 characters in the description.'
  else if (description.length > 400)
    errors.description = 'Description cannot exceed 400 characters.'

  if (!category) errors.category = 'Please select a trade category.'
  else if (!TRADE_CATEGORIES.includes(category))
    errors.category = 'Please choose a valid trade category from the list.'

  if (!city) errors.city = 'Please select a city.'
  else if (!CITIES.includes(city))
    errors.city = 'Please choose a valid city from the list.'

  if (!suburb) errors.suburb = 'Please select a suburb.'
  else if (!suburbOptions.map((option) => option.trim()).includes(suburb))
    errors.suburb = 'Please choose a suburb that matches the selected city.'

  if (!postedDistance)
    errors.postedDistance = 'Please select a posted distance.'
  else if (!POSTED_DISTANCES.includes(postedDistance))
    errors.postedDistance = 'Please choose a valid distance from the list.'

  return errors
}

export function validateQuote(amountValue, messageValue) {
  const amount = Number(amountValue)
  if (!Number.isFinite(amount) || amount < 1)
    return 'Enter a valid quote amount.'
  if (messageValue.trim().length < 10)
    return 'Add a quote message of at least 10 characters.'
  return ''
}
