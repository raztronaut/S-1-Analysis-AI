import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Chart,
} from 'chart.js';
import Card from './common/Card';
import Loader from './common/Loader';
import { extractData } from '../services/geminiService';
import type { ExtractedData } from '../types';
import { PREDEFINED_EXTRACTIONS } from '../constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);


interface DataExtractionProps {
    documentText: string;
}

const DataExtraction: React.FC<DataExtractionProps> = ({ documentText }) => {
    const [dataType, setDataType] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [results, setResults] = useState<ExtractedData[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentExtraction, setCurrentExtraction] = useState<string>('');
    const [showChart, setShowChart] = useState<boolean>(false);

    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    const handleExtraction = useCallback(async (type: string) => {
        if (!type || !documentText) return;
        setIsLoading(true);
        setResults(null);
        setError(null);
        setShowChart(false);
        setCurrentExtraction(type);
        try {
            const data = await extractData(documentText, type);
            if (data !== null) {
                setResults(data);
                if (data.filter(r => typeof r.numericValue === 'number' && r.numericValue !== null).length >= 2) {
                    setShowChart(true);
                }
            } else {
                setError("Failed to parse the extracted data from the AI. The response might be malformed or empty.");
            }
        } catch (e) {
            console.error(e);
            setError('An error occurred while extracting data.');
        } finally {
            setIsLoading(false);
        }
    }, [documentText]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleExtraction(dataType);
    };

    const canVisualize = useMemo(() => {
        if (!results) return false;
        const numericResults = results.filter(r => typeof r.numericValue === 'number' && r.numericValue !== null);
        return numericResults.length >= 2;
    }, [results]);

    const chartData = useMemo(() => {
        if (!canVisualize || !results) return null;
        
        const dataPoints = results.filter(r => typeof r.numericValue === 'number' && r.numericValue !== null);
        const chartUnit = dataPoints.find(r => r.unit)?.unit || '';

        return {
            labels: dataPoints.map(r => r.period),
            datasets: [
                {
                    label: `${currentExtraction} ${chartUnit ? `(in ${chartUnit})` : ''}`,
                    data: dataPoints.map(r => r.numericValue as number),
                    backgroundColor: 'rgba(56, 189, 248, 0.6)',
                    borderColor: 'rgba(56, 189, 248, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        };
    }, [results, currentExtraction, canVisualize]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: '#94a3b8', font: { family: 'Inter' } }
            },
            title: {
                display: true,
                text: `Visualization for "${currentExtraction}"`,
                color: '#f8fafc',
                font: { size: 16, family: 'Inter', weight: '600' }
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#f8fafc',
                bodyColor: '#94a3b8',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 10,
                titleFont: { family: 'Inter' },
                bodyFont: { family: 'Inter' },
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#94a3b8', font: { family: 'Inter' } },
                grid: { color: 'rgba(51, 65, 85, 0.5)' }
            },
            x: {
                ticks: { color: '#94a3b8', font: { family: 'Inter' } },
                grid: { color: 'transparent' }
            }
        }
    }), [currentExtraction]);

    useEffect(() => {
        if (showChart && canVisualize && chartData && chartRef.current) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'bar',
                    data: chartData,
                    options: chartOptions,
                });
            }
        }

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [showChart, canVisualize, chartData, chartOptions]);


    return (
        <div className="p-8 flex-grow space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-dark-text-primary">Data Extraction</h2>
                <p className="text-dark-text-secondary text-lg mt-1">Extract specific financial data points from the S-1 filing.</p>
            </div>
            
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="flex flex-col sm:flex-row items-center gap-4">
                        <input
                            type="text"
                            value={dataType}
                            onChange={(e) => setDataType(e.target.value)}
                            placeholder="e.g., Revenue, Net Loss, Key Personnel"
                            className="flex-grow w-full p-3 bg-surface border border-dark-border rounded-lg text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                            disabled={isLoading}
                        />
                         <button type="submit"
                            className="w-full sm:w-auto px-6 py-3 bg-brand-primary text-slate-900 font-semibold rounded-lg hover:bg-opacity-80 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all flex-shrink-0"
                            disabled={isLoading || !dataType}>
                            Extract
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {PREDEFINED_EXTRACTIONS.map(item => (
                            <button key={item} type="button" onClick={() => { setDataType(item); handleExtraction(item); }}
                                className="px-3 py-1.5 bg-overlay text-dark-text-secondary rounded-full text-sm hover:bg-brand-primary hover:text-slate-900 font-medium transition-colors duration-200"
                                disabled={isLoading}>
                                {item}
                            </button>
                        ))}
                    </div>
                </form>
            </Card>

            {isLoading && <Loader />}
            {error && <Card><p className="text-destructive">{error}</p></Card>}
            
            {results && (
                <Card className="animate-fade-in">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <h3 className="text-xl font-semibold text-brand-primary">Results for "{currentExtraction}"</h3>
                        {canVisualize && (
                             <button onClick={() => setShowChart(prev => !prev)}
                                className="px-4 py-2 bg-overlay text-dark-text-primary rounded-md text-sm hover:bg-brand-primary hover:text-slate-900 font-medium transition-colors duration-200">
                                {showChart ? 'Hide Chart' : 'Visualize'}
                            </button>
                        )}
                    </div>

                    {showChart && canVisualize && (
                        <div className="mb-6 h-80 relative bg-surface p-4 rounded-lg">
                           <canvas ref={chartRef}></canvas>
                        </div>
                    )}
                    
                    {results.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-dark-border">
                                    <tr>
                                        <th className="p-4 text-sm font-semibold text-dark-text-primary uppercase tracking-wider">Figure</th>
                                        <th className="p-4 text-sm font-semibold text-dark-text-primary uppercase tracking-wider">Period</th>
                                        <th className="p-4 text-sm font-semibold text-dark-text-primary uppercase tracking-wider">Citation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((item, index) => (
                                        <tr key={index} className="border-b border-dark-border last:border-b-0 hover:bg-overlay transition-colors">
                                            <td className="p-4 text-dark-text-primary font-medium">{item.figure}</td>
                                            <td className="p-4 text-dark-text-secondary">{item.period}</td>
                                            <td className="p-4 text-dark-text-secondary italic">"{item.citation}"</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-dark-text-secondary text-center py-8">No data found for "{currentExtraction}".</p>
                    )}
                </Card>
            )}
        </div>
    );
};

export default DataExtraction;