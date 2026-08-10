import {
  CITIES,
  POSTED_DISTANCES,
  QUOTE_PRICE_TYPES,
  TRADE_CATEGORIES,
} from './constants.js'

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

export function validateQuote(values, today = new Date()) {
  const errors = {}
  const amount = Number(values.amount)
  const todayValue = new Date(today)
  const localToday = [
    todayValue.getFullYear(),
    String(todayValue.getMonth() + 1).padStart(2, '0'),
    String(todayValue.getDate()).padStart(2, '0'),
  ].join('-')

  if (!QUOTE_PRICE_TYPES.some(({ value }) => value === values.priceType))
    errors.priceType = 'Please select a price type.'
  if (!Number.isFinite(amount) || amount < 1 || amount > 1000000)
    errors.amount = 'Enter a valid quote price between $1 and $1,000,000.'
  if (!values.availability)
    errors.availability = 'Please select an available date.'
  else if (values.availability < localToday)
    errors.availability = 'Availability cannot be in the past.'

  for (const [field, label, maxLength] of [
    ['arrivalWindow', 'arrival window', 120],
    ['includedWork', 'included work', 1000],
    ['conditions', 'conditions', 1000],
    ['expectedDuration', 'expected duration', 120],
  ]) {
    const value = values[field]?.trim() ?? ''
    if (!value) errors[field] = `Please enter the ${label}.`
    else if (value.length > maxLength)
      errors[field] = `${label[0].toUpperCase()}${label.slice(1)} is too long.`
  }

  if ((values.message?.trim() ?? '').length > 1000)
    errors.message = 'Message cannot exceed 1000 characters.'

  return errors
}
