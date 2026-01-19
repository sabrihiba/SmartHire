import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';

export interface DonutChartData {
    value: number;
    color: string;
    label?: string;
}

interface DonutChartProps {
    data: DonutChartData[];
    radius?: number;
    strokeWidth?: number;
    centerLabel?: string;
    centerValue?: string | number;
}

export default function DonutChart({
    data,
    radius = 80,
    strokeWidth = 20,
    centerLabel,
    centerValue,
}: DonutChartProps) {
    const total = useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);

    const formattedData = useMemo(() => {
        let currentAngle = 0;
        return data.map((item) => {
            const percentage = total === 0 ? 0 : item.value / total;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            return {
                ...item,
                percentage,
                startAngle,
                angle,
            };
        });
    }, [data, total]);

    const circumference = 2 * Math.PI * radius;
    const halfCircle = radius + strokeWidth;

    if (total === 0) {
        return (
            <View style={styles.container}>
                <Svg
                    width={radius * 2 + strokeWidth * 2}
                    height={radius * 2 + strokeWidth * 2}
                    viewBox={`0 0 ${(radius * 2 + strokeWidth * 2)} ${(radius * 2 + strokeWidth * 2)}`}
                >
                    <G rotation="-90" origin={`${halfCircle}, ${halfCircle}`}>
                        <Circle
                            cx="50%"
                            cy="50%"
                            r={radius}
                            stroke="#E5E7EB"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                        />
                    </G>
                </Svg>
                <View style={styles.centerTextContainer}>
                    <Text style={styles.centerValue}>0</Text>
                    {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Svg
                width={radius * 2 + strokeWidth * 2}
                height={radius * 2 + strokeWidth * 2}
                viewBox={`0 0 ${(radius * 2 + strokeWidth * 2)} ${(radius * 2 + strokeWidth * 2)}`}
            >
                <G rotation="-90" origin={`${halfCircle}, ${halfCircle}`}>
                    {formattedData.map((item, index) => {
                        return (
                            <Circle
                                key={index}
                                cx="50%"
                                cy="50%"
                                r={radius}
                                stroke={item.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference - (circumference * item.percentage)}
                                strokeLinecap="round" // Optional: makes segment ends round
                                fill="transparent"
                                rotation={item.startAngle}
                                origin={`${halfCircle}, ${halfCircle}`}
                            />
                        );
                    })}
                </G>
            </Svg>
            <View style={styles.centerTextContainer}>
                <Text style={styles.centerValue}>{centerValue ?? total}</Text>
                {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    centerTextContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    centerLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
});
