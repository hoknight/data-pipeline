
export interface SchoolData {
  year: number;
  schoolCount: number;
  studentCount: number;
  totalStaff: number | null;
  catholicStaff: number | null;
  nonCatholicStaff: number | null;
  catholicStaffPercentage: number | null;
}

export type MetricKey = keyof Omit<SchoolData, 'year'>;

export interface MetricConfig {
  name: string;
  color: string;
}

export const METRIC_CONFIG: Record<MetricKey, MetricConfig> = {
  schoolCount: { name: '天主教學校', color: '#ef4444' }, // rgba(239, 68, 68, 0.8)
  studentCount: { name: '學生人數', color: '#3b82f6' }, // rgba(59, 130, 246, 0.8)
  totalStaff: { name: '教職員總人數', color: '#16a34a' }, // rgba(22, 163, 74, 0.8)
  catholicStaff: { name: '公教教職員人數', color: '#f59e0b' }, // rgba(245, 158, 11, 0.8)
  nonCatholicStaff: { name: '非公教教職員人數', color: '#8b5cf6' }, // rgba(139, 92, 246, 0.8)
  catholicStaffPercentage: { name: '公教教職員人數百分比', color: '#ff0279' }, // rgba(255, 2, 121, 0.8)
};

export type AxisAssignment = 'left' | 'right';
export type MetricAssignments = Record<MetricKey, AxisAssignment>;
export type ChartType = 'line' | 'bar' | 'area';