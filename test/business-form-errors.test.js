import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

function read(relativePath) {
  return readFile(new URL(relativePath, import.meta.url), 'utf8')
}

test('business text fields use red borders and rings for invalid values', async () => {
  const [portalStyles, onboarding, onboardingStyles] = await Promise.all([
    read('../src/pages/business/BusinessPortal.css'),
    read('../src/pages/business/BusinessOnboarding.jsx'),
    read('../src/pages/business/BusinessOnboarding.css'),
  ])

  assert.match(
    portalStyles,
    /body\.business-surface input\[aria-invalid='true'\]/,
  )
  assert.match(
    portalStyles,
    /body\.business-surface textarea\[aria-invalid='true'\]/,
  )
  assert.match(
    portalStyles,
    /body\.business-surface select\[aria-invalid='true'\]/,
  )
  assert.match(
    portalStyles,
    /service-price-input:has\(input\[aria-invalid='true'\]\)/,
  )
  assert.match(portalStyles, /rgb\(201 42 42 \/ 18%\)/)
  assert.match(onboarding, /aria-invalid=\{invalidFields\.includes/)
  assert.match(onboarding, /invalid=\{invalidFields\.includes\('location'\)\}/)
  assert.match(
    onboardingStyles,
    /\.business-onboarding-error[\s\S]*?background: transparent/,
  )
})

test('login and registration use field-level invalid states without alert panels', async () => {
  const [login, loginStyles, register, registerStyles] = await Promise.all([
    read('../src/pages/auth/LoginPage.jsx'),
    read('../src/pages/auth/LoginPage.css'),
    read('../src/pages/auth/RegisterPage.jsx'),
    read('../src/pages/auth/RegisterPage.css'),
  ])

  assert.match(login, /aria-invalid=\{invalidFields\.includes\('email'\)\}/)
  assert.match(login, /aria-invalid=\{invalidFields\.includes\('password'\)\}/)
  assert.match(loginStyles, /input\[aria-invalid='true'\]/)
  assert.match(
    loginStyles,
    /\.auth-error\.login-message[\s\S]*?background: transparent/,
  )

  assert.match(register, /invalidFields\.includes\('fullName'\)/)
  assert.match(register, /invalidFields\.includes\('confirmPassword'\)/)
  assert.match(registerStyles, /input\[aria-invalid='true'\]/)
  assert.match(
    registerStyles,
    /\.auth-error\.register-account-error[\s\S]*?background: transparent/,
  )
})

test('customer portal styles are not targeted by the business invalid-field rule', async () => {
  const portalStyles = await read('../src/pages/business/BusinessPortal.css')

  assert.doesNotMatch(portalStyles, /body\.customer-surface.*aria-invalid/)
  assert.doesNotMatch(portalStyles, /customer-(?:page|portal).*aria-invalid/)
})
