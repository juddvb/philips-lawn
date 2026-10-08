import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';
import { edgeMidpoints, fromLocalFt, insertMidpoint, type LatLng, toLocalFt } from '../lib/lawnGeometry';
import { colors, fonts } from '../theme';
import { type LawnMapProps, ZONE_COLORS } from './LawnMap.types';

/** Feet shown across the width of the editor. */
const SPAN_FT = 240;

/**
 * Web build only (react-native-maps has no web support): the same zone editor on a plain grid,
 * without satellite imagery. Lets the outline flow be developed and tested in a browser.
 * Zones are selected from the chips under the map (SVG press handlers warn on web).
 */
export function LawnMap({ center, zones, selectedKey, selectedVertex, onSelectVertex, onChangePoints, onCenterChange }: LawnMapProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const pxPerFt = size.w / SPAN_FT || 1;
  const toPx = (p: LatLng) => {
    const ft = toLocalFt(p, center);
    return { x: size.w / 2 + ft.x * pxPerFt, y: size.h / 2 - ft.y * pxPerFt };
  };
  const fromPx = (x: number, y: number) => fromLocalFt({ x: (x - size.w / 2) / pxPerFt, y: (size.h / 2 - y) / pxPerFt }, center);
  const selected = zones.find((z) => z.key === selectedKey);

  return (
    <View
      style={[StyleSheet.absoluteFill, s.ground]}
      onLayout={(e) => {
        setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
        onCenterChange(center);
      }}
    >
      {size.w > 0 ? (
        <>
          <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
            {Array.from({ length: Math.ceil(SPAN_FT / 20) + 1 }, (_, i) => (
              <Line key={`gx${i}`} x1={i * 20 * pxPerFt} y1={0} x2={i * 20 * pxPerFt} y2={size.h} stroke="rgba(255,255,255,0.08)" />
            ))}
            {Array.from({ length: Math.ceil(size.h / (20 * pxPerFt)) + 1 }, (_, i) => (
              <Line key={`gy${i}`} x1={0} y1={i * 20 * pxPerFt} x2={size.w} y2={i * 20 * pxPerFt} stroke="rgba(255,255,255,0.08)" />
            ))}
            {zones.map((z, i) => (
              <Polygon
                key={z.key}
                points={z.points.map((p) => { const q = toPx(p); return `${q.x},${q.y}`; }).join(' ')}
                fill={z.key === selectedKey ? 'rgba(233,247,216,0.35)' : 'rgba(233,247,216,0.18)'}
                stroke={ZONE_COLORS[i % ZONE_COLORS.length]}
                strokeWidth={z.key === selectedKey ? 3 : 2}
                strokeDasharray={z.key === selectedKey ? undefined : '8 6'}
              />
            ))}
          </Svg>
          {selected
            ? edgeMidpoints(selected.points).map((p, i) => {
                const q = toPx(p);
                return (
                  <Pressable
                    key={`m${i}`}
                    accessibilityRole="button"
                    aria-label={`Add a corner on edge ${i + 1}`}
                    onPress={() => {
                      onChangePoints(selected.key, insertMidpoint(selected.points, i));
                      onSelectVertex(i + 1);
                    }}
                    style={[s.mid, { left: q.x - 11, top: q.y - 11 }]}
                  >
                    <Text style={s.midText}>+</Text>
                  </Pressable>
                );
              })
            : null}
          {selected?.points.map((p, i) => (
            <Handle
              key={`v${i}`}
              at={toPx(p)}
              on={selectedVertex === i}
              label={`Corner ${i + 1}`}
              onStart={() => onSelectVertex(i)}
              onMove={(x, y) => {
                const next = [...selected.points];
                next[i] = fromPx(x, y);
                onChangePoints(selected.key, next);
              }}
            />
          ))}
          <Text style={s.note}>Web preview: no satellite imagery. Grid squares are 20 ft.</Text>
        </>
      ) : null}
    </View>
  );
}

function Handle({ at, on, label, onStart, onMove }: { at: { x: number; y: number }; on: boolean; label: string; onStart(): void; onMove(x: number, y: number): void }) {
  // Where the drag started: the handle's position and the pointer's page position.
  const drag = useRef({ x: 0, y: 0, pageX: 0, pageY: 0 });

  return (
    <View
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        drag.current = { x: at.x, y: at.y, pageX: e.nativeEvent.pageX, pageY: e.nativeEvent.pageY };
        onStart();
      }}
      onResponderMove={(e) => {
        const d = drag.current;
        onMove(d.x + e.nativeEvent.pageX - d.pageX, d.y + e.nativeEvent.pageY - d.pageY);
      }}
      aria-label={label}
      style={[s.vertex, on && s.vertexOn, { left: at.x - 11, top: at.y - 11 }]}
    />
  );
}

const s = StyleSheet.create({
  ground: { backgroundColor: '#5E7A4E', overflow: 'hidden' },
  vertex: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 4, borderColor: colors.green, cursor: 'grab' } as object,
  vertexOn: { backgroundColor: colors.highlight, borderColor: colors.ink },
  mid: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(20,34,26,0.75)', alignItems: 'center', justifyContent: 'center' },
  midText: { color: colors.surface, fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 17 },
  note: { position: 'absolute', right: 8, top: 8, color: colors.surface, fontFamily: fonts.bodySemi, fontSize: 11, opacity: 0.8 },
});
