import React, { useState, useCallback } from 'react';
import Card from './common/Card';
import Loader from './common/Loader';
import { analyzeQuery } from '../services/geminiService';
import type { AnalysisResult } from '../types';
import { PREDEFINED_QUESTIONS } from '../constants';

const ConfidencePill: React.FC<{ score: number }> = ({ score }) => {
    const getPillStyle = () => {
        if (score > 0.8) return 'bg-green-400/10 text-green-400 border border-green-400/20';
        if (score > 0.5) return 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20';
        return 'bg-red-400/10 text-red-400 border border-red-400/20';
    };

    return (
        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getPillStyle()}`}>
            {`CONFIDENCE: ${(score * 100).toFixed(0)}%`}
        </span>
    );
};

interface SummaryQAProps {
    documentText: string;
}

const SummaryQA: React.FC<SummaryQAProps> = ({ documentText }) => {
    const [query, setQuery] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = useCallback(async (currentQuery: string) => {
        if (!currentQuery || !documentText) return;
        setIsLoading(true);
        setResult(null);
        setError(null);
        try {
            const analysis = await analyzeQuery(documentText, currentQuery);
            if (analysis) {
                 setResult(analysis);
            } else {
                 setError("Failed to parse the analysis from the AI. The response might be malformed.");
            }
        } catch (e) {
            console.error(e);
            setError('An error occurred while analyzing the document.');
        } finally {
            setIsLoading(false);
        }
    }, [documentText]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAnalysis(query);
    };

    return (
        <div className="p-8 flex-grow space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-dark-text-primary">Summary & Q/A</h2>
                <p className="text-dark-text-secondary text-lg mt-1">Ask a question or select a predefined query to analyze the document.</p>
            </div>
            
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., What was the revenue for the most recent fiscal year?"
                        className="w-full p-3 bg-surface border border-dark-border rounded-lg text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                        rows={3}
                        disabled={isLoading}
                    />
                    <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                         <div className="flex flex-wrap gap-2">
                            {PREDEFINED_QUESTIONS.map(q => (
                                <button key={q} type="button" onClick={() => { setQuery(q); handleAnalysis(q); }}
                                    className="px-3 py-1.5 bg-overlay text-dark-text-secondary rounded-full text-sm hover:bg-brand-primary hover:text-slate-900 font-medium transition-colors duration-200"
                                    disabled={isLoading}>
                                    {q}
                                </button>
                            ))}
                        </div>
                        <button type="submit"
                            className="px-6 py-2 bg-brand-primary text-slate-900 font-semibold rounded-lg hover:bg-opacity-80 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                            disabled={isLoading || !query}>
                            {isLoading ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </div>
                </form>
            </Card>

            {isLoading && <Loader />}
            {error && <Card><p className="text-destructive">{error}</p></Card>}
            
            {result && (
                <Card className="animate-fade-in">
                    <div className="space-y-5">
                        <div className="flex justify-between items-start">
                             <h3 className="text-xl font-semibold text-brand-primary">Analysis Result</h3>
                             {result.confidenceScore !== undefined && <ConfidencePill score={result.confidenceScore} />}
                        </div>
                       
                        <div>
                            <h4 className="font-semibold text-dark-text-primary mb-1">Answer</h4>
                            <p className="text-dark-text-secondary leading-relaxed">{result.answer}</p>
                        </div>
                        
                        {result.citation && result.citation !== "Not found." && (
                             <div>
                                <h4 className="font-semibold text-dark-text-primary mb-1">Verbatim Citation</h4>
                                <blockquote className="border-l-4 border-brand-primary pl-4 py-2 bg-surface rounded-r-lg">
                                    <p className="text-dark-text-secondary italic">"{result.citation}"</p>
                                </blockquote>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default SummaryQA;