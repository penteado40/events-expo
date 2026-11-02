import { act, renderHook, waitFor } from '@testing-library/react-native'

import { createGroupChoiceStore } from '../group-choice-store'

/** Renders the store and waits until it has loaded from SecureStore. */
async function open() {
  const useStore = createGroupChoiceStore()
  const hook = await renderHook(() => useStore())
  await waitFor(() => expect(hook.result.current.hydrated).toBe(true))
  return hook.result
}

describe('Group choice store', () => {
  it('remembers the chosen Group when the app is reopened', async () => {
    const first = await open()
    await act(() => first.current.choose(5, 2))

    const reopened = await open()

    expect(reopened.current.chosenBy[5]).toBe(2)
  })

  it('remembers one choice per User on the device', async () => {
    const store = await open()
    await act(() => store.current.choose(5, 2))
    await act(() => store.current.choose(2, 1))

    const reopened = await open()

    expect(reopened.current.chosenBy).toEqual({ 5: 2, 2: 1 })
  })

  it('starts with no choice', async () => {
    const store = await open()

    expect(store.current.chosenBy).toEqual({})
  })
})
