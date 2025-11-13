
import React, { useState, useEffect, useCallback, useRef } from 'react';
import DataChart from './components/DataChart';
import { ALL_SCHOOL_DATA, YEARS, MIN_YEAR, MAX_YEAR } from './data';
import { SchoolData, MetricKey, METRIC_CONFIG, MetricAssignments, ChartType } from './types';

// Determines which axis each metric should be on based on a fixed rule for clarity.
const getMetricAssignments = (): MetricAssignments => {
    const assignments: Partial<MetricAssignments> = {};
    for (const key of Object.keys(METRIC_CONFIG) as MetricKey[]) {
        // Rule: School count and percentages go on the right axis. Everything else on the left.
        if (key === 'schoolCount' || key === 'catholicStaffPercentage') {
            assignments[key] = 'right';
        } else {
            assignments[key] = 'left';
        }
    }
    return assignments as MetricAssignments;
};

const initialMetrics: MetricKey[] = ['schoolCount'];
const initialChartTypes: Record<MetricKey, ChartType> = {
    schoolCount: 'bar',
    studentCount: 'line',
    totalStaff: 'line',
    catholicStaff: 'line',
    nonCatholicStaff: 'line',
    catholicStaffPercentage: 'line',
};


// Sub-components defined outside App to prevent re-renders
const Header: React.FC = () => (
    <header className="text-center p-4 md:p-6 border-b border-gray-700">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
        香港天主教學校統計資料 (1953-2024)
        </h1>
    </header>
);

const ControlPanel: React.FC<{
    startYear: number;
    endYear: number;
    selectedMetrics: MetricKey[];
    chartTypes: Record<MetricKey, ChartType>;
    onStartYearChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onEndYearChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onMetricToggle: (metric: MetricKey) => void;
    onChartTypeChange: (metric: MetricKey, type: ChartType) => void;
    onReset: () => void;
    onFullScreen: () => void;
}> = ({ startYear, endYear, selectedMetrics, chartTypes, onStartYearChange, onEndYearChange, onMetricToggle, onChartTypeChange, onReset, onFullScreen }) => (
    <div className="w-full lg:w-80 lg:flex-shrink-0 bg-gray-800 p-4 rounded-lg shadow-lg">
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-3 text-sky-300">年份選擇</h3>
                <div className="flex space-x-2">
                    <div className="w-1/2">
                        <label htmlFor="start-year" className="block text-sm font-medium text-gray-300 mb-1">開始年份</label>
                        <select id="start-year" value={startYear} onChange={onStartYearChange} className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-sky-500 focus:border-sky-500">
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="w-1/2">
                        <label htmlFor="end-year" className="block text-sm font-medium text-gray-300 mb-1">結束年份</label>
                        <select id="end-year" value={endYear} onChange={onEndYearChange} className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-sky-500 focus:border-sky-500">
                            {YEARS.filter(y => y >= startYear).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-3 text-sky-300">多選項目</h3>
                <div className="space-y-2">
                    {(Object.keys(METRIC_CONFIG) as MetricKey[]).map(key => (
                        <div key={key} className="p-2 rounded-md hover:bg-gray-700 transition-colors duration-200">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id={`metric-checkbox-${key}`}
                                    checked={selectedMetrics.includes(key)}
                                    onChange={() => onMetricToggle(key)}
                                    className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-sky-500 focus:ring-sky-600"
                                    style={{ accentColor: METRIC_CONFIG[key].color }}
                                />
                                <label htmlFor={`metric-checkbox-${key}`} className="flex-grow text-gray-200 cursor-pointer">{METRIC_CONFIG[key].name}</label>
                                <select 
                                    value={chartTypes[key]}
                                    onChange={(e) => onChartTypeChange(key, e.target.value as ChartType)}
                                    disabled={!selectedMetrics.includes(key)}
                                    className="bg-gray-600 text-white text-xs rounded p-1 border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="line">線圖</option>
                                    <option value="bar">長條圖</option>
                                    <option value="area">面積圖</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col space-y-3">
            <button onClick={onFullScreen} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                全螢幕
            </button>
            <button onClick={onReset} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                重設
            </button>
        </div>
    </div>
);

const App: React.FC = () => {
  const [startYear, setStartYear] = useState<number>(MIN_YEAR);
  const [endYear, setEndYear] = useState<number>(MAX_YEAR);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(initialMetrics);
  const [chartTypes, setChartTypes] = useState<Record<MetricKey, ChartType>>(initialChartTypes);
  const [chartData, setChartData] = useState<SchoolData[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Assignments are now fixed and don't need to be in state.
  const metricAssignments = getMetricAssignments();

  useEffect(() => {
    const filteredData = ALL_SCHOOL_DATA.filter(d => d.year >= startYear && d.year <= endYear);
    setChartData(filteredData);
  }, [startYear, endYear]);

  const handleStartYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStartYear = parseInt(e.target.value, 10);
    setStartYear(newStartYear);
    if (newStartYear > endYear) {
      setEndYear(newStartYear);
    }
  };

  const handleEndYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEndYear(parseInt(e.target.value, 10));
  };
  
  const handleMetricToggle = useCallback((metric: MetricKey) => {
    setSelectedMetrics(prev =>
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  }, []);

  const handleChartTypeChange = useCallback((metric: MetricKey, type: ChartType) => {
    setChartTypes(prev => ({ ...prev, [metric]: type }));
  }, []);
  
  const handleReset = useCallback(() => {
    setStartYear(MIN_YEAR);
    setEndYear(MAX_YEAR);
    setSelectedMetrics(initialMetrics);
    setChartTypes(initialChartTypes);
  }, []);
  
  const handleFullScreen = useCallback(() => {
    const element = chartRef.current;
    if (element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) { // Chrome, Safari and Opera
            (element as any).webkitRequestFullscreen();
        }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header />
      <main className="p-4 md:p-6 flex-grow">
          <div className="flex flex-col lg:flex-row gap-6">
              <ControlPanel
                  startYear={startYear}
                  endYear={endYear}
                  selectedMetrics={selectedMetrics}
                  chartTypes={chartTypes}
                  onStartYearChange={handleStartYearChange}
                  onEndYearChange={handleEndYearChange}
                  onMetricToggle={handleMetricToggle}
                  onChartTypeChange={handleChartTypeChange}
                  onReset={handleReset}
                  onFullScreen={handleFullScreen}
              />
              <div className="flex-grow lg:h-[calc(100vh-200px)] min-h-[500px] bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-lg" ref={chartRef}>
                  <DataChart data={chartData} metrics={selectedMetrics} assignments={metricAssignments} chartTypes={chartTypes} />
              </div>
          </div>
      </main>
      <footer className="p-4 text-center text-xs text-gray-500">
        資料來源: 香港天主教教區檔案統計資料{' '}
        <a 
          href="https://archives.catholic.org.hk/Statistic/ST-Index.htm" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="underline hover:text-sky-400"
        >
          https://archives.catholic.org.hk/Statistic/ST-Index.htm
        </a>
      </footer>
    </div>
  );
};

export default App;
