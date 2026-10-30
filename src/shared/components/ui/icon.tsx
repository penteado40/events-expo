import type { ColorValue } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

/** Icons from the Media kit (Ícones): 1.8 px stroke on a 24 grid, rounded ends. */
const ICONS = {
  home: <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  today: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  people: (
    <>
      <Circle cx={9} cy={8} r={3.5} />
      <Path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.7.8 2.9 2.6 3.5 5.2" />
    </>
  ),
  profile: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
}

export type IconName = keyof typeof ICONS

type Props = { name: IconName; color: ColorValue; size?: number }

/** A decorative icon: the control around it carries the accessibility label. */
export function Icon({ name, color, size = 24 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
    >
      {ICONS[name]}
    </Svg>
  )
}
