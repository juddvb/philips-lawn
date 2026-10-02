import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Stroke icons from the prototype's tab bar. */
export type IconName = 'lawn' | 'forecast' | 'book' | 'pro' | 'account';

export function Icon({ name, color, size = 22 }: { name: IconName; color: ColorValue; size?: number }) {
  const stroke = { stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'lawn' && (
        <>
          <Path d="M4 21c0-6 2-10 5-13" {...stroke} />
          <Path d="M9 21c0-5 1-9 3-12" {...stroke} />
          <Path d="M14 21c0-4 2-8 6-11" {...stroke} />
          <Path d="M2 21h20" {...stroke} />
        </>
      )}
      {name === 'forecast' && (
        <>
          <Path d="M7 17a4 4 0 0 1-.5-8 5 5 0 0 1 9.7-1.2A3.6 3.6 0 1 1 17 17Z" {...stroke} />
          <Path d="M9 20l-1 2M13 20l-1 2M17 20l-1 2" {...stroke} />
        </>
      )}
      {name === 'book' && (
        <>
          <Path d="M3 12V4h8l9 9-8 8z" {...stroke} />
          <Circle cx={7.5} cy={7.5} r={1.5} {...stroke} />
        </>
      )}
      {name === 'pro' && (
        <>
          <Rect x={3} y={7} width={18} height={13} rx={2} {...stroke} />
          <Path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" {...stroke} />
        </>
      )}
      {name === 'account' && (
        <>
          <Circle cx={12} cy={8} r={4} {...stroke} />
          <Path d="M4 21c1-4 4-6 8-6s7 2 8 6" {...stroke} />
        </>
      )}
    </Svg>
  );
}
