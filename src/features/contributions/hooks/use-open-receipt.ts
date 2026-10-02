import { useMutation } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'

import { ApiError } from '@/shared/lib/api-error'

import { contributionsRepository } from '../api'

const BROWSER_FAILED = 'Não foi possível abrir o comprovante. Tente de novo.'

/**
 * Opens a Contribution's Receipt in the in-app browser. Its URL is signed and short-lived, so each
 * tap asks for a fresh one and nothing is cached. `opening` lasts only while the URL loads; the
 * browser opens without waiting for it to close. `error` is the API's message, or a fixed one when
 * the browser fails to open (never a native message).
 */
export function useOpenReceipt(eventId: number, contributionId: number) {
  const [browserFailed, setBrowserFailed] = useState(false)
  const receipt = useMutation<string, Error>({
    mutationFn: () => contributionsRepository.getReceiptUrl(eventId, contributionId),
    onMutate: () => setBrowserFailed(false),
    onSuccess: (url) => {
      WebBrowser.openBrowserAsync(url).catch(() => setBrowserFailed(true))
    },
  })
  const error = receipt.error
    ? receipt.error instanceof ApiError
      ? receipt.error.message
      : BROWSER_FAILED
    : browserFailed
      ? BROWSER_FAILED
      : null

  return { open: () => receipt.mutate(), opening: receipt.isPending, error }
}
