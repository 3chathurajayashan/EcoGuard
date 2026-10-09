const React = require('react');
const { View, Text } = require('react-native');

function MapView({ style, children }) {
  return React.createElement(
    View,
    { style: [{ backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' }, style] },
    React.createElement(Text, { style: { color: '#2E7D32' } }, 'Map is available on the mobile app'),
    children,
  );
}

const Passthrough = ({ children }) => (children ? React.createElement(View, null, children) : null);

module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = Passthrough;
module.exports.Callout = Passthrough;
module.exports.Circle = Passthrough;
module.exports.Polyline = Passthrough;
module.exports.Polygon = Passthrough;
module.exports.PROVIDER_GOOGLE = 'google';
module.exports.PROVIDER_DEFAULT = null;
