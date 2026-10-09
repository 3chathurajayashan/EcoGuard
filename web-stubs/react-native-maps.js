// Web only: react-native-maps is native-only, so in the browser <MapView> draws the same free
// tile map the rest of the app uses (src/components/svg-map). iOS and Android use the real package.
const React = require('react');
const { View } = require('react-native');
const SvgMap = require('../src/components/svg-map').default;

const PIN_COLORS = { orange: '#E65100', green: '#2E7D32', red: '#C62828', blue: '#1565C0' };

function MapView({ style, children, initialRegion, region }) {
  const [height, setHeight] = React.useState(0);
  const r = region || initialRegion;

  const markers = [];
  React.Children.forEach(children, (child) => {
    const coordinate = child && child.props && child.props.coordinate;
    if (!coordinate) return;
    markers.push({
      id: String(markers.length),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      kind: 'pin',
      color: PIN_COLORS[child.props.pinColor] || child.props.pinColor || PIN_COLORS.green,
      label: child.props.title,
    });
  });

  // Keep the requested region in view, just like initialRegion does on a phone
  const include = r
    ? [
        { latitude: r.latitude - (r.latitudeDelta || 0.05) / 2, longitude: r.longitude - (r.longitudeDelta || 0.05) / 2 },
        { latitude: r.latitude + (r.latitudeDelta || 0.05) / 2, longitude: r.longitude + (r.longitudeDelta || 0.05) / 2 },
      ]
    : [];

  return React.createElement(
    View,
    { style: [{ flex: 1 }, style], onLayout: (e) => setHeight(e.nativeEvent.layout.height) },
    height ? React.createElement(SvgMap, { height, markers, include, style: { borderRadius: 0, borderWidth: 0 } }) : null,
  );
}

const Passthrough = () => null;

module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = Passthrough;
module.exports.Callout = Passthrough;
module.exports.Circle = Passthrough;
module.exports.Polyline = Passthrough;
module.exports.Polygon = Passthrough;
module.exports.PROVIDER_GOOGLE = 'google';
module.exports.PROVIDER_DEFAULT = null;
