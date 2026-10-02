import { useMutation } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'

import type { ApiError } from '@/shared/lib/api-error'

import { contributionsRepository } from '../api'

/**
 * Opens a Contribution's Receipt in the in-app browser. Its URL is signed and short-lived, so each
 * call asks for a fresh one and nothing is cached. Pending only while the URL loads, not while the
 * browser stays open.
 */
export const useOpenReceipt = (eventId: number, contributionId: number) =>
  useMutation<string, ApiError>({
    mutationFn: () => contributionsRepository.getReceiptUrl(eventId, contributionId),
    onSuccess: (url) => {
      WebBrowser.openBrowserAsync(url)
    },
  })
