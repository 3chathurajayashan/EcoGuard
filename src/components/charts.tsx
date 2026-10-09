import React, { useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

const FONT = Platform.select({ web: 'Arial, Helvetica, sans-serif', default: undefined });

/** Rounds a maximum up to a tidy axis value (e.g. 7 -> 8, 43 -> 50). */
function niceMax(max: number) {
  if (max <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / step) * step;
}

interface ChartProps {
  labels: string[];
  values: number[];
  height?: number;
  color?: string;
}

const PAD = { l: 26, r: 8, t: 14, b: 22 };

function Axis({ width, height, max }: { width: number; height: number; max: number }) {
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
  return (
    <>
      {ticks.map((t) => {
        const y = PAD.t + (1 - t / max) * (height - PAD.t - PAD.b);
        return (
          <G key={t}>
            <Line x1={PAD.l} y1={y} x2={width - PAD.r} y2={y} stroke="#E3E8E3" strokeWidth={1} />
            <SvgText x={PAD.l - 5} y={y + 3} fontSize={9} fill="#78909C" textAnchor="end" fontFamily={FONT}>
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </SvgText>
          </G>
        );
      })}
    </>
  );
}

function useWidth() {
  const [width, setWidth] = useState(0);
  return { width, onLayout: (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width) };
}

export function BarChart({ labels, values, height = 130, color = '#2E9E4D' }: ChartProps) {
  const { width, onLayout } = useWidth();
  const max = niceMax(Math.max(0, ...values));
  const inner = width - PAD.l - PAD.r;
  const slot = values.length ? inner / values.length : inner;
  const plotH = height - PAD.t - PAD.b;

  return (
    <View style={s.box} onLayout={onLayout}>
      {width ? (
        <Svg width={width} height={height}>
          <Axis width={width} height={height} max={max} />
          {values.map((v, i) => {
            const h = (v / max) * plotH;
            const x = PAD.l + i * slot + slot * 0.2;
            return (
              <G key={labels[i] + i}>
                <Rect x={x} y={PAD.t + plotH - h} width={slot * 0.6} height={h} rx={3} fill={color} />
                <SvgText x={x + slot * 0.3} y={PAD.t + plotH - h - 4} fontSize={9} fontWeight="bold" fill="#37474F" textAnchor="middle" fontFamily={FONT}>
                  {v}
                </SvgText>
                <SvgText x={x + slot * 0.3} y={height - 6} fontSize={9} fill="#546E7A" textAnchor="middle" fontFamily={FONT}>
                  {labels[i]}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

export function LineChart({ labels, values, height = 130, color = '#2E9E4D' }: ChartProps) {
  const { width, onLayout } = useWidth();
  const max = niceMax(Math.max(0, ...values));
  const inner = width - PAD.l - PAD.r;
  const plotH = height - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (values.length === 1 ? inner / 2 : (inner * (i + 0.5)) / values.length);
  const y = (v: number) => PAD.t + plotH - (v / max) * plotH;

  return (
    <View style={s.box} onLayout={onLayout}>
      {width ? (
        <Svg width={width} height={height}>
          <Axis width={width} height={height} max={max} />
          <Polyline points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {values.map((v, i) => (
            <G key={labels[i] + i}>
              <Circle cx={x(i)} cy={y(v)} r={4} fill="#FFF" stroke={color} strokeWidth={2} />
              <SvgText x={x(i)} y={y(v) - 8} fontSize={9} fontWeight="bold" fill="#37474F" textAnchor="middle" fontFamily={FONT}>
                {v}
              </SvgText>
              <SvgText x={x(i)} y={height - 6} fontSize={9} fill="#546E7A" textAnchor="middle" fontFamily={FONT}>
                {labels[i]}
              </SvgText>
            </G>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  box: { width: '100%' },
});
