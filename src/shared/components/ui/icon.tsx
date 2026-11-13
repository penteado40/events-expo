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
  back: <Path d="M15 5l-7 7 7 7" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  chevronDown: <Path d="m6 9 6 6 6-6" />,
  check: <Path d="M5 12.5l4.5 4.5L19 7.5" />,
  calendar: (
    <Path d="M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1M4 10h16M8 3v4M16 3v4" />
  ),
  search: (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="m20 20-4-4" />
    </>
  ),
  alert: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 8v5M12 16h.01" />
    </>
  ),
  phone: (
    <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  ),
  profile: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
}

export type IconName = keyof typeof ICONS

type Props = { name: IconName; color: ColorValue; size?: number; strokeWidth?: number }

/** A decorative icon: the control around it carries the accessibility label. */
export function Icon({ name, color, size = 24, strokeWidth = 1.8 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
    >
      {ICONS[name]}
    </Svg>
  )
}
