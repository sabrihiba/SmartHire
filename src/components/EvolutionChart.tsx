import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, G } from 'react-native-svg';

interface EvolutionChartProps {
  data: { date: string; count: number }[];
  title?: string;
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <View className="bg-white p-5 rounded-3xl shadow-medium border border-gray-100">
        <Text className="text-lg font-bold text-gray-900 mb-4">{title || 'Évolution'}</Text>
        <Text className="text-sm text-gray-500 text-center py-8">Aucune donnée disponible</Text>
      </View>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 200;
  const chartWidth = 300;
  const padding = 40;
  const barWidth = (chartWidth - padding * 2) / data.length - 5;

  return (
    <View className="bg-white p-5 rounded-3xl shadow-medium border border-gray-100">
      {title && <Text className="text-lg font-bold text-gray-900 mb-4">{title}</Text>}
      <View className="items-center">
        <Svg width={chartWidth} height={chartHeight}>
          {/* Axes */}
          <Line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke="#E5E7EB"
            strokeWidth="2"
          />
          <Line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight - padding}
            stroke="#E5E7EB"
            strokeWidth="2"
          />

          {/* Bars */}
          {data.map((item, index) => {
            const barHeight = (item.count / maxCount) * (chartHeight - padding * 2);
            const x = padding + index * (barWidth + 5);
            const y = chartHeight - padding - barHeight;

            return (
              <G key={index}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#2563EB"
                  rx="4"
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight - padding + 15}
                  fontSize="10"
                  fill="#6B7280"
                  textAnchor="middle"
                >
                  {new Date(item.date).toLocaleDateString('fr-FR', { month: 'short' })}
                </SvgText>
                {item.count > 0 && (
                  <SvgText
                    x={x + barWidth / 2}
                    y={y - 5}
                    fontSize="10"
                    fill="#2563EB"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {item.count}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      </View>
    </View>
  );
};

