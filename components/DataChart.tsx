import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { SchoolData, MetricKey, METRIC_CONFIG, MetricAssignments, ChartType } from '../types';

interface DataChartProps {
  data: SchoolData[];
  metrics: MetricKey[];
  assignments: MetricAssignments;
  chartTypes: Record<MetricKey, ChartType>;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 bg-opacity-90 p-4 rounded-lg border border-gray-700 shadow-lg">
          <p className="font-bold text-lg text-white">{`年份: ${label}`}</p>
          <ul className="mt-2">
            {payload.map((pld: any) => (
              <li key={pld.dataKey} style={{ color: pld.color || pld.fill }} className="flex items-center justify-between">
                <span className="font-semibold">{`${pld.name}:`}</span>
                <span className="ml-4 font-mono">{pld.value.toLocaleString()}{pld.dataKey.includes('Percentage') ? '%' : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  };

const DataChart: React.FC<DataChartProps> = ({ data, metrics, assignments, chartTypes }) => {
  const [selectedPoint, setSelectedPoint] = useState<SchoolData | null>(null);
  const [highlightedMetric, setHighlightedMetric] = useState<MetricKey | null>(null);

  const { leftDomain, rightDomain } = useMemo(() => {
    const metricsOnLeft = metrics.filter(m => assignments[m] === 'left');
    const metricsOnRight = metrics.filter(m => assignments[m] === 'right');

    const calculateDomain = (keys: MetricKey[]): [number, number] | [number, string] => {
        if (keys.length === 0) return [0, 'auto'];
        let min = Infinity;
        let max = -Infinity;
        data.forEach(d => {
            keys.forEach(key => {
                const value = d[key];
                if (value !== null && typeof value !== 'undefined') {
                    if (value < min) min = value;
                    if (value > max) max = value;
                }
            });
        });
        if (min === Infinity || max === -Infinity) return [0, 'auto'];
        
        const padding = (max - min) * 0.1;
        const finalMin = min - padding > 0 ? min - padding : 0;
        
        return [Math.floor(finalMin), Math.ceil(max + padding)];
    };

    return {
        leftDomain: calculateDomain(metricsOnLeft),
        rightDomain: calculateDomain(metricsOnRight)
    };
}, [data, metrics, assignments]);

  if (metrics.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-800 rounded-lg">
        <p className="text-gray-400 text-xl">請選擇至少一項數據以生成統計圖</p>
      </div>
    );
  }

  const handleChartClick = () => {
    setSelectedPoint(null);
    setHighlightedMetric(null);
  };
  
  const handleLineDataPointClick = (props: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setHighlightedMetric(props.dataKey as MetricKey);
    setSelectedPoint(props.payload);
  };

  const metricsOnRight = metrics.filter(m => assignments[m] === 'right');
  const showRightAxis = metricsOnRight.length > 0;
  const rightAxisUnit = metricsOnRight.length === 1 && metricsOnRight[0] === 'catholicStaffPercentage' ? '%' : undefined;
  
  const renderMetric = (metric: MetricKey) => {
    const config = METRIC_CONFIG[metric];
    const yAxisId = assignments[metric];
    const chartType = chartTypes[metric];
    const isHighlighted = highlightedMetric === metric;
    
    // FIX: The onClick handler for Bar and Area have different signatures.
    // This creates a common handler and adapts the call for each component.
    const handleDataPointClick = (data: any, event: React.MouseEvent) => {
      event.stopPropagation();
      setHighlightedMetric(metric);
      setSelectedPoint(data.payload);
    };

    switch(chartType) {
        case 'bar':
            return <Bar key={metric} dataKey={metric} name={config.name} fill={config.color} yAxisId={yAxisId} fillOpacity={isHighlighted ? 1 : 0.7} onClick={(data, _index, event) => handleDataPointClick(data, event)} />;
        case 'area':
            return <Area key={metric} type="monotone" dataKey={metric} name={config.name} stroke={config.color} fill={config.color} fillOpacity={isHighlighted ? 0.6 : 0.3} strokeWidth={isHighlighted ? 3 : 2} yAxisId={yAxisId} connectNulls onClick={handleDataPointClick} />;
        case 'line':
        default:
             return (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                name={config.name}
                stroke={config.color}
                yAxisId={yAxisId}
                strokeWidth={isHighlighted ? 4 : 2.5}
                filter={isHighlighted ? 'url(#glow)' : undefined}
                dot={{ r: 2 }}
                activeDot={{ 
                    r: 6,
                    onClick: handleLineDataPointClick,
                }}
                connectNulls
              />
            );
    }
  }

  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onClick={handleChartClick}
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
          <XAxis dataKey="year" stroke="#a0aec0" />
          <YAxis yAxisId="left" stroke="#a0aec0" domain={leftDomain} allowDataOverflow={true} tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
          {showRightAxis && <YAxis yAxisId="right" orientation="right" stroke="#a0aec0" domain={rightDomain} allowDataOverflow={true} unit={rightAxisUnit} />}
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {metrics.map(renderMetric)}
        </ComposedChart>
      </ResponsiveContainer>
      {selectedPoint && (
        <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-80 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-lg z-10 max-w-sm" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-lg text-white">{`年份: ${selectedPoint.year}`}</h4>
              <button
                onClick={handleChartClick}
                className="text-gray-400 hover:text-white"
                aria-label="Close details"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              </button>
          </div>
          <ul className="space-y-1">
            {(Object.keys(METRIC_CONFIG) as MetricKey[])
            .map(metricKey => {
                const value = selectedPoint[metricKey];
                if (value !== null && typeof value !== 'undefined') {
                    const { name, color } = METRIC_CONFIG[metricKey];
                    return (
                        <li key={metricKey} className="flex justify-between items-center text-sm">
                            <span style={{ color }} className="font-semibold flex items-center">
                                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color }}></span>
                                {name}:
                            </span>
                            <span className="ml-4 font-mono text-gray-200">
                                {value.toLocaleString()}{metricKey.includes('Percentage') ? '%' : ''}
                            </span>
                        </li>
                    );
                }
                return null;
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DataChart;
