import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

export interface BarChartData {
    label: string;
    value: number;
}

interface BarChartProps {
    data: BarChartData[];
    height?: number;
    barColor?: string;
}

export default function BarChart({
    data,
    height = 200,
    barColor = '#8B5CF6', // Purple-ish default
}: BarChartProps) {
    const [width, setWidth] = useState(0);

    const onLayout = (event: LayoutChangeEvent) => {
        setWidth(event.nativeEvent.layout.width);
    };

    const { maxValue, chartData } = useMemo(() => {
        const max = Math.max(...data.map((d) => d.value), 1); // Avoid div by 0
        // Add some headroom
        const ceiling = Math.ceil(max * 1.1);
        return { maxValue: ceiling, chartData: data };
    }, [data]);

    const yAxisTicks = useMemo(() => {
        return [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(maxValue * t));
    }, [maxValue]);

    if (width === 0) {
        return <View style={{ height }} onLayout={onLayout} />;
    }

    const paddingBottom = 30;
    const paddingLeft = 50;
    const paddingTop = 20;
    const chartHeight = height - paddingBottom;
    const chartWidth = width - paddingLeft;

    const barWidth = (chartWidth / data.length) * 0.6;
    const gap = (chartWidth / data.length) * 0.4;

    return (
        <View style={{ height }} onLayout={onLayout}>
            <Svg width={width} height={height}>
                {/* Y Axis Lines & Text */}
                {yAxisTicks.map((tick, i) => {
                    const y = chartHeight + paddingTop - (tick / maxValue) * chartHeight;
                    return (
                        <React.Fragment key={i}>
                            <SvgText
                                x={paddingLeft - 8}
                                y={y + 4}
                                fontSize="10"
                                fill="#9CA3AF"
                                textAnchor="end"
                            >
                                {tick}
                            </SvgText>
                            {/* Horizontal grid line */}
                            {i > 0 && (
                                <Line
                                    x1={paddingLeft}
                                    y1={y}
                                    x2={width}
                                    y2={y}
                                    stroke="#F3F4F6"
                                    strokeDasharray="4 4"
                                />
                            )}
                        </React.Fragment>
                    )
                })}

                {/* Bars */}
                {data.map((item, index) => {
                    const barHeight = (item.value / maxValue) * chartHeight;
                    const x = paddingLeft + (index * (barWidth + gap)) + (gap / 2);
                    const y = chartHeight + paddingTop - barHeight;

                    return (
                        <React.Fragment key={index}>
                            <Rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill={barColor}
                                rx={4} // Rounded top corners
                            />
                            {/* X Axis Labels */}
                            <SvgText
                                x={x + barWidth / 2}
                                y={height - 5}
                                fontSize="10"
                                fill="#6B7280"
                                textAnchor="middle"
                            >
                                {item.label}
                            </SvgText>
                        </React.Fragment>
                    );
                })}
            </Svg>
        </View>
    );
}
