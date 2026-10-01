import { Image } from 'expo-image'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Defs, Pattern, Rect } from 'react-native-svg'

import { colors, radii } from '@/shared/theme'

const SIZE = 48
const STRIPE = 6

/**
 * A Registry item's 48×48 image over the prototype's striped placeholder, which shows while it
 * loads, when the item has no image and when it fails to load.
 */
export function ItemThumbnail({ imageUrl }: { imageUrl: string | null }) {
  const [failed, setFailed] = useState(false)

  return (
    <View style={styles.frame}>
      <StripedPlaceholder />
      {imageUrl && !failed && (
        <Image
          source={imageUrl}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          recyclingKey={imageUrl}
          onError={() => setFailed(true)}
          accessible={false}
        />
      )}
    </View>
  )
}

/** `repeating-linear-gradient(135deg, .1 0 6px, .04 6px 12px)`. */
function StripedPlaceholder() {
  return (
    <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern
          id="stripes"
          width={STRIPE * 2}
          height={STRIPE * 2}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <Rect width={STRIPE} height={STRIPE * 2} fill={colors.stripeLight} />
          <Rect x={STRIPE} width={STRIPE} height={STRIPE * 2} fill={colors.stripeDark} />
        </Pattern>
      </Defs>
      <Rect width={SIZE} height={SIZE} fill="url(#stripes)" />
    </Svg>
  )
}

const styles = StyleSheet.create({
  frame: { width: SIZE, height: SIZE, borderRadius: radii.thumbnail, overflow: 'hidden' },
})
