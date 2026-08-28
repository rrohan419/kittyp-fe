import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WeightLog, DailyLog } from '@/types/nutrition';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { Scale, TrendingUp } from 'lucide-react';

interface ProgressChartsProps {
  weightHistory: WeightLog[];
  dailyLogs: DailyLog[];
  onLogWeight: (weight: number) => void;
  currentDate: Date;
}

export const ProgressCharts = ({ weightHistory, dailyLogs, onLogWeight, currentDate }: ProgressChartsProps) => {
  const [newWeight, setNewWeight] = useState('');

  const handleLogWeight = () => {
    const weight = parseFloat(newWeight);
    if (!isNaN(weight) && weight > 0) {
      onLogWeight(weight);
      setNewWeight('');
    }
  };

  // Prepare weight chart data
  const weightChartData = weightHistory.map(w => ({
    date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: Number(w.weight.toFixed(1)),
  }));

  // Prepare hydration chart data (last 14 days)
  const hydrationChartData = dailyLogs.slice(-14).map(log => ({
    date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hydration: log.hydrationMl,
  }));

  // Prepare meal completion chart data (last 14 days)
  const mealCompletionData = dailyLogs.slice(-14).map(log => {
    const completedMeals = log.meals.filter(m => m.completed).length;
    const totalMeals = log.meals.length;
    return {
      date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completion: Math.round((completedMeals / totalMeals) * 100),
    };
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Weight Logging */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-5 w-5 text-primary" />
          <h3 className="text-base sm:text-lg font-semibold">Log Weight</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Label htmlFor="weight" className="text-sm">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="25.5"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="flex sm:items-end">
            <Button onClick={handleLogWeight} className="w-full sm:w-auto text-sm">Log Weight</Button>
          </div>
        </div>
        {weightHistory.length > 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Last recorded: {weightHistory[weightHistory.length - 1].weight.toFixed(1)} kg on{' '}
            {new Date(weightHistory[weightHistory.length - 1].date).toLocaleDateString()}
          </p>
        )}
      </Card>

      {/* Weight Trend Chart */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Weight Trend
        </h3>
        <ResponsiveContainer width="100%" height={250} className="sm:hidden">
          <LineChart data={weightChartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-[10px]"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-[10px]"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 3 }}
              activeDot={{ r: 5 }}
              name="Weight (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={300} className="hidden sm:block">
          <LineChart data={weightChartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
              name="Weight (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Hydration Chart */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Hydration Consistency (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={250} className="sm:hidden">
          <BarChart data={hydrationChartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-[10px]"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-[10px]"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar 
              dataKey="hydration" 
              fill="hsl(var(--chart-1))" 
              radius={[8, 8, 0, 0]}
              name="Hydration (ml)"
            />
          </BarChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={300} className="hidden sm:block">
          <BarChart data={hydrationChartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar 
              dataKey="hydration" 
              fill="hsl(var(--chart-1))" 
              radius={[8, 8, 0, 0]}
              name="Hydration (ml)"
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Meal Completion Chart */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Meal Completion % (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={250} className="sm:hidden">
          <BarChart data={mealCompletionData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-[10px]"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-[10px]"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar 
              dataKey="completion" 
              fill="hsl(var(--chart-2))" 
              radius={[8, 8, 0, 0]}
              name="Completion %"
            />
          </BarChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={300} className="hidden sm:block">
          <BarChart data={mealCompletionData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar 
              dataKey="completion" 
              fill="hsl(var(--chart-2))" 
              radius={[8, 8, 0, 0]}
              name="Completion %"
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
