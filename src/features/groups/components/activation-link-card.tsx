import * as Clipboard from 'expo-clipboard'
import { useState } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'

import { Button, Icon } from '@/shared/components/ui'
import { deviceToday, periodLabel } from '@/shared/domain/local-dates'
import { normalizePhone } from '@/shared/domain/phone'
import { fonts, textStyles, useTheme } from '@/shared/theme'

import type { ActivationLink } from '../schemas'

type Props = {
  link: ActivationLink
  /** Who the link is for: their first name opens the message. */
  name: string
  /** Their phone (as stored or typed): the WhatsApp conversation opens with them when it is one. */
  phone: string
  groupName: string
  /** Said above the link, e.g. that the previous one stopped working. */
  note?: string
}

/** The WhatsApp message with the link, for the person's own conversation when there is a phone. */
export function whatsappShareUrl({ link, name, phone, groupName }: Props): string {
  const firstName = name.trim().split(/\s+/)[0]
  const text = `Oi, ${firstName}! Este é o seu link para entrar no ${groupName}: ${link.url}`
  const digits = normalizePhone(phone)?.slice(1) ?? ''
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

/**
 * "Repasse o link por outro meio" (D-Convite): the Activation link in mono, "Enviar no WhatsApp"
 * and "Copiar link", for when the email does not arrive. Until when it lasts, from the API.
 */
export function ActivationLinkCard(props: Props) {
  const { link, note } = props
  const { colors } = useTheme()
  const [copied, setCopied] = useState(false)
  const until = periodLabel({
    startDate: deviceToday(new Date(link.expiresAt)),
    endDate: deviceToday(new Date(link.expiresAt)),
    timezone: 'UTC',
  })

  const copy = async () => {
    await Clipboard.setStringAsync(link.url)
    setCopied(true)
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>Repasse o link por outro meio</Text>
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        {note ? `${note} ` : ''}Se o e-mail não chegar, mande este link pelo WhatsApp. Ele vale uma
        vez, até {until}
      </Text>
      <Text
        selectable
        accessibilityLabel="Activation link"
        style={[textStyles.mono, styles.url, { backgroundColor: colors.bg, color: colors.text }]}
      >
        {link.url}
      </Text>
      <Button
        label="Enviar no WhatsApp"
        icon={<Icon name="phone" color={colors.onAction} size={18} />}
        onPress={() => Linking.openURL(whatsappShareUrl(props))}
      />
      <Button
        label={copied ? 'Link copiado' : 'Copiar link'}
        variant="secondary"
        icon={copied ? <Icon name="check" color={colors.text} size={18} /> : undefined}
        onPress={copy}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 26, padding: 20, gap: 14 },
  title: { fontFamily: fonts.sans700, fontSize: 17 },
  hint: { fontFamily: fonts.sans400, fontSize: 14, lineHeight: 20, marginTop: -6 },
  url: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
})
