import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native'

import { SkeletonBlock } from '@/shared/components/ui'

type Props = {
  /** Undefined while the Registry loads. */
  name: string | undefined
  style: StyleProp<TextStyle>
  /** The skeleton bar's size, matching the text it stands for. */
  skeleton: { width: number; height: number }
  numberOfLines?: number
  /** Whether the bar's slot takes the row's free space (a card's left side) or just shrinks. */
  fill?: boolean
}

/** A Contribution's Registry item name, or a skeleton bar while the Registry loads. */
export function ItemName({ name, style, skeleton, numberOfLines, fill = false }: Props) {
  if (name === undefined) {
    return (
      <View style={fill ? styles.fill : styles.shrink}>
        <SkeletonBlock width={skeleton.width} height={skeleton.height} />
      </View>
    )
  }
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {name}
    </Text>
  )
}

const styles = StyleSheet.create({ fill: { flex: 1 }, shrink: { flexShrink: 1 } })
