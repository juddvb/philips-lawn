import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { edgeMidpoints, insertMidpoint } from '../lib/lawnGeometry';
import { colors, fonts } from '../theme';
import { type LawnMapProps, ZONE_COLORS } from './LawnMap.types';

/**
 * Satellite map with the lawn zones drawn on top. The selected zone shows draggable corners
 * and "+" handles on each edge to add a corner. Apple Maps on iOS, Google on Android
 * (no key needed in Expo Go; production builds need a Google Maps key, see docs/SPEC.md).
 */
export function LawnMap({ center, zones, selectedKey, selectedVertex, onSelectZone, onSelectVertex, onChangePoints, onCenterChange }: LawnMapProps) {
  const selected = zones.find((z) => z.key === selectedKey);

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      mapType="satellite"
      initialRegion={{ ...center, latitudeDelta: 0.0012, longitudeDelta: 0.0012 }}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      onRegionChangeComplete={(r) => onCenterChange({ latitude: r.latitude, longitude: r.longitude })}
      onPress={() => onSelectVertex(null)}
    >
      {zones.map((z, i) => (
        <Polygon
          key={z.key}
          coordinates={z.points}
          tappable
          onPress={() => onSelectZone(z.key)}
          strokeColor={ZONE_COLORS[i % ZONE_COLORS.length]}
          strokeWidth={z.key === selectedKey ? 3 : 2}
          fillColor={z.key === selectedKey ? 'rgba(233,247,216,0.35)' : 'rgba(233,247,216,0.18)'}
          lineDashPattern={z.key === selectedKey ? undefined : [8, 6]}
        />
      ))}

      {selected?.points.map((p, i) => (
        <Marker
          // Remount when selection changes so the custom view redraws with tracksViewChanges off.
          key={`${selected.key}-v${i}-${selectedVertex === i}`}
          coordinate={p}
          draggable
          stopPropagation
          tracksViewChanges={false}
          anchor={{ x: 0.5, y: 0.5 }}
          onPress={() => onSelectVertex(i)}
          onDragStart={() => onSelectVertex(i)}
          onDragEnd={(e) => {
            const next = [...selected.points];
            next[i] = e.nativeEvent.coordinate;
            onChangePoints(selected.key, next);
          }}
          accessibilityLabel={`Corner ${i + 1}`}
        >
          <View style={[s.vertex, selectedVertex === i && s.vertexOn]} />
        </Marker>
      ))}

      {selected
        ? edgeMidpoints(selected.points).map((p, i) => (
            <Marker
              key={`${selected.key}-m${i}-${selected.points.length}`}
              coordinate={p}
              stopPropagation
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => {
                onChangePoints(selected.key, insertMidpoint(selected.points, i));
                onSelectVertex(i + 1);
              }}
              accessibilityLabel={`Add a corner on edge ${i + 1}`}
            >
              <View style={s.mid}>
                <Text style={s.midText}>+</Text>
              </View>
            </Marker>
          ))
        : null}
    </MapView>
  );
}

const s = StyleSheet.create({
  vertex: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 4, borderColor: colors.green },
  vertexOn: { backgroundColor: colors.highlight, borderColor: colors.ink },
  mid: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(20,34,26,0.75)', alignItems: 'center', justifyContent: 'center' },
  midText: { color: colors.surface, fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 17 },
});
