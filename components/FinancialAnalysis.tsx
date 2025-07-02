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
  type ChartConfiguration,
} from 'chart.js';
import Card from './common/Card';
import Loader from './common/Loader';
import CitationTooltip from './common/CitationTooltip';
import Tooltip from './common/Tooltip';
import { performFinancialAnalysis } from '../services/geminiService';
import type { FinancialAnalysisResult, WaterfallItem } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
);

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
    return (
        <Tooltip text={text}>
            <span className="inline-block ml-1.5 text-dark-text-secondary/70 cursor-help align-middle">
                <InfoIcon className="w-4 h-4" />
            </span>
        </Tooltip>
    );
};

interface FinancialAnalysisProps {
    documentText: string;
}

const getSentimentClass = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
        case 'positive': return 'text-brand-secondary';
        case 'negative': return 'text-destructive';
        default: return 'text-dark-text-secondary';
    }
};

const HealthScoreGauge: React.FC<{ score: number, rating: string }> = ({ score, rating }) => {
    const circumference = 2 * Math.PI * 45; // r=45
    const offset = circumference - (score / 100) * circumference;

    const getStrokeColor = (s: number) => {
        if (s > 75) return '#4ade80'; // secondary (green)
        if (s > 50) return '#facc15'; // yellow-400
        return '#f87171'; // destructive (red)
    }

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" className="stroke-current text-overlay" strokeWidth="10" fill="transparent" />
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        className="stroke-current transition-all duration-1000 ease-out"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        style={{ stroke: getStrokeColor(score) }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold" style={{ color: getStrokeColor(score) }}>{score}</span>
                    <span className="text-xs text-dark-text-secondary">/ 100</span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-lg font-semibold text-dark-text-primary">{rating}</p>
            </div>
        </div>
    );
};

const WaterfallChart: React.FC<{ data: WaterfallItem[] }> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    const chartConfig = useMemo((): ChartConfiguration => {
        let runningTotal = 0;
        const floatingBars = data.map(item => {
            const start = runningTotal;
            const end = runningTotal + item.value;
            runningTotal = end;
            return [start, end] as [number, number];
        });

        const chartData = {
            labels: data.map(item => item.label),
            datasets: [{
                label: 'Amount (in millions)',
                data: floatingBars,
                backgroundColor: data.map(item => item.value >= 0 ? 'rgba(74, 222, 128, 0.6)' : 'rgba(248, 113, 113, 0.6)'),
                borderColor: data.map(item => item.value >= 0 ? 'rgba(74, 222, 128, 1)' : 'rgba(248, 113, 113, 1)'),
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.8,
            }],
        };
        
        return {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: false },
                    tooltip: {
                         backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        bodyColor: '#94a3b8',
                        borderColor: '#334155',
                        borderWidth: 1,
                        padding: 10,
                        titleFont: { family: 'Inter' },
                        bodyFont: { family: 'Inter' },
                        callbacks: {
                            label: function(context) {
                                const raw = context.raw as [number, number];
                                if (!raw) return '';

                                const value = raw[1] - raw[0];
                                const label = context.label || '';
                                
                                const valuePrefix = value >= 0 ? '+' : '';
                                const formattedValue = Math.abs(value).toFixed(2);

                                return `${label}: ${valuePrefix}$${formattedValue}M`;
                            }
                        }
                    }
                },
                scales: {
                    y: { ticks: { color: '#94a3b8', font: { family: 'Inter' } }, grid: { color: 'rgba(51, 65, 85, 0.5)' } },
                    x: { ticks: { color: '#94a3b8', font: { family: 'Inter' } }, grid: { color: 'transparent' } }
                }
            },
        };
    }, [data]);
    
     useEffect(() => {
        if (chartRef.current && chartConfig) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
            const ctx = chartRef.current.getContext('2d');
            if(ctx) {
                chartInstanceRef.current = new Chart(ctx, chartConfig);
            }
        }
        return () => {
            chartInstanceRef.current?.destroy();
        };
    }, [chartConfig]);

    return <div className="h-80"><canvas ref={chartRef} /></div>;
}

const FinancialAnalysis: React.FC<FinancialAnalysisProps> = ({ documentText }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<FinancialAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = useCallback(async () => {
        setIsLoading(true);
        setResult(null);
        setError(null);
        try {
            const analysis = await performFinancialAnalysis(documentText);
            if (analysis && analysis.analysis) {
                setResult(analysis);
            } else {
                setError("Failed to generate or parse the financial analysis from the AI.");
            }
        } catch (e) {
            console.error(e);
            setError('An error occurred while generating the financial analysis.');
        } finally {
            setIsLoading(false);
        }
    }, [documentText]);

    const res = result?.analysis;
    
    const tableHeaderClass = "p-4 text-sm font-semibold text-dark-text-primary uppercase tracking-wider";
    const tableRowClass = "border-b border-dark-border last:border-b-0 hover:bg-overlay transition-colors";
    const tableCellClass = "p-4 align-top";

    return (
        <div className="p-8 flex-grow space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-dark-text-primary">Comprehensive Financial Analysis</h2>
                <p className="text-dark-text-secondary text-lg mt-1">An AI-generated deep-dive into the S-1 filing's financial health.</p>
            </div>

            {!result && !isLoading && (
                 <Card className="text-center py-10">
                    <h3 className="text-xl font-semibold text-dark-text-primary mb-2">Ready for Analysis</h3>
                    <p className="text-dark-text-secondary mb-6 max-w-2xl mx-auto">Generate a multi-faceted analysis covering profitability, growth, risks, and hidden insights with a single click.</p>
                    <button onClick={handleAnalysis}
                        className="px-8 py-3 bg-brand-primary text-slate-900 font-semibold rounded-lg hover:bg-opacity-80 disabled:bg-gray-600 transition-transform duration-200 hover:scale-105"
                        disabled={isLoading}>
                        {isLoading ? 'Analyzing...' : 'Generate Full Analysis'}
                    </button>
                </Card>
            )}

            {isLoading && <div className="pt-10"><Loader size="h-12 w-12" /></div>}
            {error && <Card><p className="text-destructive text-center">{error}</p></Card>}

            {res && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1 flex flex-col justify-center items-center text-center">
                            <h3 className="text-xl font-semibold text-brand-primary mb-4">Financial Health Score</h3>
                            <HealthScoreGauge score={res.financialHealthScore.score} rating={res.financialHealthScore.rating} />
                            <p className="text-sm text-dark-text-secondary mt-4">{res.financialHealthScore.summary}</p>
                        </Card>
                        <Card className="lg:col-span-2">
                            <h3 className="text-xl font-semibold text-brand-primary mb-4">Profitability Waterfall</h3>
                             <WaterfallChart data={res.waterfallAnalysis} />
                        </Card>
                    </div>

                    <Card>
                        <h3 className="text-xl font-semibold text-brand-primary mb-2">Overall Financial Summary</h3>
                        <p className="text-dark-text-secondary whitespace-pre-wrap leading-relaxed">{res.overallSummary}</p>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-semibold text-brand-primary mb-4">Profitability Ratios</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-dark-border">
                                    <tr>
                                        <th className={tableHeaderClass}>Metric</th>
                                        <th className={tableHeaderClass}>Value</th>
                                        <th className={tableHeaderClass}>Commentary</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {res.profitabilityRatios.map((item, index) => (
                                        <tr key={index} className={tableRowClass}>
                                            <td className={`${tableCellClass} text-dark-text-primary font-medium w-1/5`}>{item.metric}</td>
                                            <td className={`${tableCellClass} font-semibold ${getSentimentClass(item.sentiment)} w-1/5`}>{item.value}<br/><span className="text-xs text-gray-400 font-normal">{item.period}</span></td>
                                            <td className={`${tableCellClass} text-dark-text-secondary text-sm w-3/5`}>
                                                <span>{item.commentary}</span>
                                                <CitationTooltip text={item.citation} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <h3 className="text-xl font-semibold text-brand-primary mb-4">Growth & Efficiency</h3>
                             <table className="w-full text-left">
                                <tbody>
                                    {res.growthAndEfficiencyRatios.map((item, index) => (
                                        <tr key={index} className="border-b border-dark-border last:border-b-0">
                                            <td className="p-3 text-dark-text-primary font-medium">
                                                {item.metric}
                                                {item.metric === 'Revenue Retention Rate' && 
                                                    <InfoTooltip text="Measures the percentage of recurring revenue retained from existing customers. Over 100% indicates expansion revenue from that cohort." />
                                                }
                                            </td>
                                            <td className={`p-3 font-semibold text-right ${getSentimentClass(item.sentiment)}`}>
                                                {item.value}
                                                <CitationTooltip text={item.citation} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                        <Card>
                             <h3 className="text-xl font-semibold text-brand-primary mb-4">Liquidity & Leverage</h3>
                             <table className="w-full text-left">
                                <tbody>
                                    {res.liquidityAndLeverageRatios.map((item, index) => (
                                        <tr key={index} className="border-b border-dark-border last:border-b-0">
                                            <td className="p-3 text-dark-text-primary font-medium">{item.metric}</td>
                                            <td className={`p-3 font-semibold text-right ${getSentimentClass(item.sentiment)}`}>
                                                {item.value}
                                                <CitationTooltip text={item.citation} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>

                    <Card>
                        <h3 className="text-xl font-semibold text-brand-primary mb-4">Trend & Delta Analysis</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-dark-border">
                                    <tr>
                                        <th className={tableHeaderClass}>Line Item</th>
                                        <th className={tableHeaderClass}>YoY Change</th>
                                        <th className={tableHeaderClass}>
                                            Delta vs. Revenue
                                            <InfoTooltip text="Shows if an expense is growing faster or slower than revenue. A negative value is generally positive, indicating operating leverage." />
                                        </th>
                                        <th className={tableHeaderClass}>Commentary</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {res.trendAnalysis.map((item, index) => (
                                        <tr key={index} className={tableRowClass}>
                                            <td className={`${tableCellClass} text-dark-text-primary font-medium`}>{item.lineItem}</td>
                                            <td className={`${tableCellClass} font-semibold ${getSentimentClass(item.sentiment)}`}>{item.yoyChange}</td>
                                            <td className={`${tableCellClass} font-semibold ${getSentimentClass(item.sentiment)}`}>{item.deltaVsRevenue || 'N/A'}</td>
                                            <td className={`${tableCellClass} text-dark-text-secondary text-sm`}>
                                                <span>{item.commentary}</span>
                                                <CitationTooltip text={item.citation} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {res.hiddenFinancialInsights && res.hiddenFinancialInsights.length > 0 && (
                        <Card>
                            <h3 className="text-xl font-semibold text-destructive mb-4">Hidden Financial Insights</h3>
                            <div className="space-y-4">
                                {res.hiddenFinancialInsights.map((item, index) => (
                                    <div key={index} className="p-4 bg-surface rounded-lg border border-dark-border">
                                        <h4 className="font-semibold text-dark-text-primary">{item.topic}</h4>
                                        <p className="text-dark-text-secondary text-sm mt-1">
                                            {item.insight}
                                            <CitationTooltip text={item.citation} />
                                        </p>
                                        <p className="text-sm mt-2 pt-2 border-t border-dark-border/50 text-yellow-400">
                                            <span className="font-semibold">Significance: </span>{item.significance}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    <Card>
                        <h3 className="text-xl font-semibold text-brand-primary mb-4">Qualitative Insights</h3>
                        <div className="overflow-x-auto">
                             <table className="w-full text-left">
                                <thead className="border-b-2 border-dark-border">
                                    <tr>
                                        <th className={`${tableHeaderClass} w-1/4`}>Topic</th>
                                        <th className={`${tableHeaderClass} w-3/4`}>Insight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {res.miscellaneousInsights.map((item, index) => (
                                        <tr key={index} className={tableRowClass}>
                                            <td className={`${tableCellClass} text-dark-text-primary font-medium`}>{item.topic}</td>
                                            <td className={`${tableCellClass} text-sm`}>
                                                <span className={`${getSentimentClass(item.sentiment)}`}>{item.insight}</span>
                                                <CitationTooltip text={item.citation} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                             <h3 className="text-xl font-semibold text-brand-primary mb-2">Cash Flow Analysis</h3>
                             <p className="text-dark-text-secondary text-sm mb-2">{res.cashFlowAnalysis.summary}<CitationTooltip text={res.cashFlowAnalysis.citation} /></p>
                        </Card>
                         <Card>
                             <h3 className="text-xl font-semibold text-brand-primary mb-2">IPO-Specific Insights</h3>
                             <div className="space-y-4">
                                 <div>
                                     <h4 className="font-semibold text-dark-text-primary">Use of Proceeds</h4>
                                     <p className="text-dark-text-secondary text-sm">{res.ipoSpecificAnalysis.useOfProceeds.summary}<CitationTooltip text={res.ipoSpecificAnalysis.useOfProceeds.citation} /></p>
                                 </div>
                                  <div>
                                     <h4 className="font-semibold text-dark-text-primary">Customer Concentration</h4>
                                     <p className="text-dark-text-secondary text-sm">{res.ipoSpecificAnalysis.customerConcentration.summary}<CitationTooltip text={res.ipoSpecificAnalysis.customerConcentration.citation} /></p>
                                 </div>
                                  <div>
                                     <h4 className="font-semibold text-dark-text-primary">Share Structure</h4>
                                     <p className="text-dark-text-secondary text-sm">{res.ipoSpecificAnalysis.shareStructure.summary}<CitationTooltip text={res.ipoSpecificAnalysis.shareStructure.citation} /></p>
                                 </div>
                             </div>
                         </Card>
                    </div>

                </div>
            )}
        </div>
    );
};

export default FinancialAnalysis;