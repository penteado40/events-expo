import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  useBottomSheetSpringConfigs,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
} from '@gorhom/bottom-sheet'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { radii } from '@/shared/theme'

import { Glass } from './glass'

/** Sides and bottom: the sheet floats inside the screen's edges. */
const INSET = 8

type Props = {
  /** Called once the sheet has closed (swipe down or tap outside): the route pops here. */
  onClose: () => void
  children: ReactNode
}

/**
 * The floating bottom sheet (README "Folha"): detached 8 pt from the sides and bottom, Sheet
 * material with radius 40 and a handle, over a dim backdrop that closes it on tap. Sized by its
 * content, opens with a spring.
 */
export function Sheet({ onClose, children }: Props) {
  const animationConfigs = useBottomSheetSpringConfigs({ damping: 22, stiffness: 220, mass: 1 })

  return (
    <BottomSheet
      detached
      bottomInset={INSET}
      style={styles.sheet}
      enablePanDownToClose
      onClose={onClose}
      animationConfigs={animationConfigs}
      backdropComponent={Backdrop}
      backgroundComponent={Background}
      handleStyle={styles.handle}
      handleIndicatorStyle={styles.indicator}
    >
      <BottomSheetView>
        <View style={styles.content}>{children}</View>
      </BottomSheetView>
    </BottomSheet>
  )
}

function Backdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.35}
      pressBehavior="close"
    />
  )
}

function Background({ style }: BottomSheetBackgroundProps) {
  return (
    <View pointerEvents="none" style={style}>
      <Glass variant="sheet" radius={radii.sheet} style={styles.flex} />
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: { marginHorizontal: INSET },
  flex: { flex: 1 },
  handle: { paddingTop: 10, paddingBottom: 0 },
  indicator: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.3)' },
  content: { paddingTop: 14, paddingHorizontal: 20, paddingBottom: 26, gap: 14 },
})
