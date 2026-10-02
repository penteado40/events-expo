import { useMutation } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'

import type { ApiError } from '@/shared/lib/api-error'

import { contributionsRepository } from '../api'

/**
 * Opens a Contribution's Receipt in the in-app browser. Its URL is signed and short-lived, so each
 * call asks for a fresh one and nothing is cached. Settles when the browser closes (it covers the
 * sheet meanwhile), so a failure to open it shows like a failure to fetch the URL.
 */
export const useOpenReceipt = (eventId: number, contributionId: number) =>
  useMutation<void, ApiError | Error>({
    mutationFn: async () => {
      const url = await contributionsRepository.getReceiptUrl(eventId, contributionId)
      await WebBrowser.openBrowserAsync(url)
    },
  })
