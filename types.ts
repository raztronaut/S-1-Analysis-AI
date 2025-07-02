import type { Chat } from "@google/genai";

export enum View {
  SUMMARY_QA = 'Summary & Q/A',
  DATA_EXTRACTION = 'Data Extraction',
  CHAT = 'Chat',
  FINANCIAL_ANALYSIS = 'Financial Analysis',
}

export interface AnalysisResult {
  answer: string;
  confidenceScore: number;
  citation: string;
}

export interface ExtractedData {
    figure: string;
    period: string;
    citation:string;
    numericValue?: number | null;
    unit?: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

export type GeminiChat = Chat;

// Types for the new Financial Analysis feature
export interface FinancialHealthScore {
    score: number; // 0-100
    rating: string; // e.g., "High Growth, High Burn"
    summary: string;
}

export interface WaterfallItem {
    label: string;
    value: number; // Can be positive or negative
}

export interface FinancialRatio {
    metric: string;
    value: string; // e.g., "174%" or "Not Available"
    period: string;
    commentary: string; // AI generated insight on this specific metric
    citation: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface TrendAnalysisItem {
    lineItem: string; // e.g., "Revenue", "Operating Expenses"
    yoyChange: string;
    deltaVsRevenue?: string;
    commentary: string;
    citation: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface MiscellaneousInsight {
    topic: string;
    insight: string;
    citation: string;
    sentiment: 'positive' | 'negative' | 'neutral';
}

export interface HiddenFinancialInsight {
    topic: string; // e.g., "Cloud Hosting Commitment"
    insight: string; // "Company has a non-cancelable commitment of $X.X million..."
    significance: string; // "This represents a massive off-balance-sheet liability of ~$XXXk per day."
    citation: string;
}

export interface FinancialAnalysisContent {
    financialHealthScore: FinancialHealthScore;
    waterfallAnalysis: WaterfallItem[];
    overallSummary: string;
    profitabilityRatios: FinancialRatio[];
    growthAndEfficiencyRatios: FinancialRatio[];
    liquidityAndLeverageRatios: FinancialRatio[];
    trendAnalysis: TrendAnalysisItem[];
    miscellaneousInsights: MiscellaneousInsight[];
    hiddenFinancialInsights: HiddenFinancialInsight[];
    cashFlowAnalysis: {
        summary: string;
        citation: string;
    };
    ipoSpecificAnalysis: {
        useOfProceeds: { summary: string; citation: string; };
        customerConcentration: { summary: string; citation: string; };
        shareStructure: { summary: string; citation: string; };
    };
}

export interface FinancialAnalysisResult {
    analysis: FinancialAnalysisContent;
}