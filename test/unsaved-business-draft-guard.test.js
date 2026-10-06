import assert from 'node:assert/strict'
import test from 'node:test'
import * as React from 'react'
import useUnsavedBusinessDraftGuard from '../src/business/useUnsavedBusinessDraftGuard.js'

// The suite uses React's installed hook dispatcher so the hook runs without a DOM
// test package. State updates are committed by calling render again.
const internals =
  React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE

function createHookHarness(hook, initialProps) {
  const slots = []
  const effects = new Map()
  let cursor = 0
  let output
  let props = initialProps

  const dispatcher = {
    useState(initialValue) {
      const index = cursor++
      if (!slots[index]) {
        slots[index] = {
          value:
            typeof initialValue === 'function' ? initialValue() : initialValue,
        }
      }
      return [
        slots[index].value,
        (nextValue) => {
          const current = slots[index].value
          slots[index].value =
            typeof nextValue === 'function' ? nextValue(current) : nextValue
        },
      ]
    },
    useRef(initialValue) {
      const index = cursor++
      if (!slots[index]) slots[index] = { current: initialValue }
      return slots[index]
    },
    useEffect(callback, dependencies) {
      const index = cursor++
      const previous = effects.get(index)
      if (
        previous &&
        dependencies.every((value, offset) =>
          Object.is(value, previous.dependencies[offset]),
        )
      )
        return
      previous?.cleanup?.()
      effects.set(index, {
        dependencies,
        cleanup: callback(),
      })
    },
  }

  function render(nextProps = props) {
    props = nextProps
    cursor = 0
    const previous = internals.H
    internals.H = dispatcher
    try {
      output = hook(props)
    } finally {
      internals.H = previous
    }
    return output
  }

  render()
  return {
    get output() {
      return output
    },
    render,
    unmount() {
      for (const effect of effects.values()) effect.cleanup?.()
      effects.clear()
    },
  }
}

function createEventTarget() {
  const listeners = new Map()
  return {
    addEventListener(type, callback) {
      const callbacks = listeners.get(type) ?? new Set()
      callbacks.add(callback)
      listeners.set(type, callbacks)
    },
    removeEventListener(type, callback) {
      listeners.get(type)?.delete(callback)
    },
    dispatch(type, event) {
      for (const callback of listeners.get(type) ?? []) callback(event)
    },
    count(type) {
      return listeners.get(type)?.size ?? 0
    },
  }
}

function setup(t, { isActive = true, onSaveDraft } = {}) {
  const originalWindow = globalThis.window
  const originalDocument = globalThis.document
  const windowEvents = createEventTarget()
  const documentEvents = createEventTarget()
  const routes = []
  const externalUrls = []
  const navigate = (path) => routes.push(path)
  globalThis.window = {
    ...windowEvents,
    location: {
      origin: 'https://locallink.test',
      href: 'https://locallink.test/business/deals',
      assign: (url) => externalUrls.push(url),
    },
  }
  globalThis.document = documentEvents

  const harness = createHookHarness(useUnsavedBusinessDraftGuard, {
    isActive,
    navigate,
    onSaveDraft: onSaveDraft ?? (() => Promise.resolve(true)),
  })
  t.after(() => {
    harness.unmount()
    globalThis.window = originalWindow
    globalThis.document = originalDocument
  })

  function click(href, { target = '', ...modifiers } = {}) {
    const event = {
      target: {
        closest: () =>
          href === null
            ? null
            : {
                href: new URL(href, window.location.href).href,
                target,
                getAttribute: () => href,
              },
      },
      prevented: false,
      stopped: false,
      preventDefault() {
        this.prevented = true
      },
      stopPropagation() {
        this.stopped = true
      },
      ...modifiers,
    }
    documentEvents.dispatch('click', event)
    return event
  }

  function dirty() {
    harness.output.setHasUnsavedChanges(true)
    harness.render()
  }

  return {
    harness,
    windowEvents,
    documentEvents,
    routes,
    externalUrls,
    click,
    dirty,
  }
}

test('clean or inactive drafts do not intercept links or warn before unload', (t) => {
  const fixture = setup(t)
  assert.equal(fixture.click('/business/services').prevented, false)
  assert.equal(fixture.windowEvents.count('beforeunload'), 0)
  let localLeaves = 0
  fixture.harness.output.requestLeave(() => localLeaves++)
  fixture.harness.render()
  assert.equal(localLeaves, 1)
  assert.equal(fixture.harness.output.isLeaveConfirmationOpen, false)
  fixture.harness.render({
    isActive: false,
    navigate: (path) => fixture.routes.push(path),
    onSaveDraft: () => Promise.resolve(true),
  })
  fixture.dirty()
  assert.equal(fixture.click('/business/services').prevented, false)
  assert.equal(fixture.windowEvents.count('beforeunload'), 0)
})

test('dirty active drafts intercept ordinary links and protect beforeunload', (t) => {
  const fixture = setup(t)
  fixture.dirty()
  const unload = {
    prevented: false,
    preventDefault() {
      this.prevented = true
    },
  }
  fixture.windowEvents.dispatch('beforeunload', unload)
  assert.equal(unload.prevented, true)
  assert.equal(unload.returnValue, '')

  const click = fixture.click('/business/services?tab=quotes#pending')
  fixture.harness.render()
  assert.equal(click.prevented, true)
  assert.equal(click.stopped, true)
  assert.equal(fixture.harness.output.isLeaveConfirmationOpen, true)
  assert.deepEqual(fixture.routes, [])
})

test('hash-only, blank-target, missing, and modifier links are ignored', (t) => {
  const fixture = setup(t)
  fixture.dirty()
  const ignored = [
    ['#details', {}],
    ['/business/services', { target: '_blank' }],
    [null, {}],
    ['/business/services', { metaKey: true }],
    ['/business/services', { ctrlKey: true }],
    ['/business/services', { shiftKey: true }],
    ['/business/services', { altKey: true }],
  ]
  for (const [href, options] of ignored) {
    assert.equal(fixture.click(href, options).prevented, false)
  }
  fixture.harness.render()
  assert.equal(fixture.harness.output.isLeaveConfirmationOpen, false)
})

test('cancel closes the dialog without navigating', (t) => {
  const fixture = setup(t)
  fixture.dirty()
  fixture.click('/business/services')
  fixture.harness.render()
  fixture.harness.output.cancelLeave()
  fixture.harness.render()
  assert.equal(fixture.harness.output.isLeaveConfirmationOpen, false)
  assert.equal(fixture.harness.output.hasUnsavedChanges, true)
  assert.deepEqual(fixture.routes, [])
})

test('discard clears dirty state and performs the pending action', (t) => {
  const fixture = setup(t)
  fixture.dirty()
  fixture.click('/business/services')
  fixture.harness.render()
  fixture.harness.output.discardAndLeave()
  fixture.harness.render()
  assert.equal(fixture.harness.output.hasUnsavedChanges, false)
  assert.equal(fixture.harness.output.isLeaveConfirmationOpen, false)
  assert.deepEqual(fixture.routes, ['/business/services'])
})

test('failed save keeps the dialog, dirty state, and pending navigation', async (t) => {
  const fixture = setup(t, { onSaveDraft: () => Promise.resolve(false) })
  fixture.dirty()
  fixture.click('/business/services')
  fixture.harness.render()
  await fixture.harness.output.saveDraftAndLeave()
  fixture.harness.render()
  assert.equal(fixture.harness.output.isLeaveConfirmationOpen, true)
  assert.equal(fixture.harness.output.hasUnsavedChanges, true)
  assert.deepEqual(fixture.routes, [])
  fixture.harness.output.discardAndLeave()
  assert.deepEqual(fixture.routes, ['/business/services'])
})

test('successful local save does not execute the back-to-list action twice', async (t) => {
  let fixture
  fixture = setup(t, {
    onSaveDraft: async () => {
      fixture.harness.output.setHasUnsavedChanges(false)
      return true
    },
  })
  let localLeaves = 0
  fixture.dirty()
  fixture.harness.output.requestLeave(() => localLeaves++)
  fixture.harness.render()
  await fixture.harness.output.saveDraftAndLeave()
  fixture.harness.render()
  assert.equal(localLeaves, 0)
  assert.equal(fixture.harness.output.isLeaveConfirmationOpen, false)
  assert.equal(fixture.harness.output.hasUnsavedChanges, false)
})

test('successful save continues internal navigation with search and hash', async (t) => {
  const fixture = setup(t)
  fixture.dirty()
  fixture.click('/business/services?tab=quotes#pending')
  fixture.harness.render()
  await fixture.harness.output.saveDraftAndLeave()
  fixture.harness.render()
  assert.deepEqual(fixture.routes, ['/business/services?tab=quotes#pending'])
  assert.equal(fixture.harness.output.isLeaveConfirmationOpen, false)
})

test('successful save continues external navigation through location.assign', async (t) => {
  const fixture = setup(t)
  fixture.dirty()
  fixture.click('https://example.test/somewhere?x=1#part')
  fixture.harness.render()
  await fixture.harness.output.saveDraftAndLeave()
  assert.deepEqual(fixture.externalUrls, [
    'https://example.test/somewhere?x=1#part',
  ])
  assert.deepEqual(fixture.routes, [])
})

test('listeners are removed when clean, inactive, or unmounted', (t) => {
  const fixture = setup(t)
  fixture.dirty()
  assert.equal(fixture.windowEvents.count('beforeunload'), 1)
  assert.equal(fixture.documentEvents.count('click'), 1)
  fixture.harness.output.setHasUnsavedChanges(false)
  fixture.harness.render()
  assert.equal(fixture.windowEvents.count('beforeunload'), 0)
  assert.equal(fixture.documentEvents.count('click'), 0)
  fixture.dirty()
  fixture.harness.render({
    isActive: false,
    navigate: (path) => fixture.routes.push(path),
    onSaveDraft: () => Promise.resolve(true),
  })
  assert.equal(fixture.windowEvents.count('beforeunload'), 0)
  assert.equal(fixture.documentEvents.count('click'), 0)
  fixture.harness.render({
    isActive: true,
    navigate: (path) => fixture.routes.push(path),
    onSaveDraft: () => Promise.resolve(true),
  })
  assert.equal(fixture.windowEvents.count('beforeunload'), 1)
  assert.equal(fixture.documentEvents.count('click'), 1)
  fixture.harness.unmount()
  assert.equal(fixture.windowEvents.count('beforeunload'), 0)
  assert.equal(fixture.documentEvents.count('click'), 0)
})
