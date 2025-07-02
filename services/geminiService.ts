
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import type { GeminiChat, ExtractedData, AnalysisResult, FinancialAnalysisResult, FinancialAnalysisContent, FinancialRatio, TrendAnalysisItem, MiscellaneousInsight, HiddenFinancialInsight } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseJsonResponse = <T,>(text: string): T | null => {
    let jsonStr = text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }
    try {
        return JSON.parse(jsonStr) as T;
    } catch (e) {
        console.error("Failed to parse JSON response:", e, "Raw text:", text);
        return null;
    }
}

export const analyzeQuery = async (documentText: string, query: string): Promise<AnalysisResult | null> => {
    const systemInstruction = `You are a team of two expert financial analysts reviewing an S-1 filing. One analyst is a skeptical risk assessor, the other is a growth-focused strategist. Your combined goal is to provide a balanced, accurate, and cited answer based *only* on the provided document. Never invent information or use outside knowledge.`;

    const prompt = `
CONTEXT:
---
${documentText}
---

QUERY: "${query}"

INSTRUCTIONS:
1.  **Initial Scan:** First, quickly read the entire CONTEXT to understand its structure.
2.  **Targeted Retrieval:** Locate the most relevant sections or sentences that address the QUERY.
3.  **Collaborative Analysis:** As a team, synthesize the information. The risk analyst should point out caveats, while the growth strategist highlights potential.
4.  **Synthesize & Cite:** Formulate a single, concise 'answer' that reflects this balanced view. Begin the answer by citing the source, for example, "According to the 'Risk Factors' section on page 20...".
5.  **Confidence Score:** Assign a 'confidenceScore' (a number between 0.0 and 1.0) based on the clarity and directness of the source material. 1.0 means the information is explicitly stated.
6.  **Verbatim Quote:** Extract the most critical sentence or phrase from the CONTEXT as the 'citation'.
7.  **Final JSON Output:** Your response MUST be in a single, valid JSON object format with three keys: "answer", "confidenceScore", and "citation". Do not add any text before or after the JSON object.
8.  **Not Found:** If you cannot find the answer in the CONTEXT, return an "answer" of "I could not find an answer to this question in the provided document.", a "confidenceScore" of 0.0, and a "citation" of "Not found.".
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.1,
        },
    });
    
    return parseJsonResponse<AnalysisResult>(response.text);
};


export const extractData = async (documentText: string, dataType: string): Promise<ExtractedData[] | null> => {
    const systemInstruction = `You are an automated financial data extraction agent. You are part of a larger analysis team. Your specific task is to find and extract specific data points with perfect accuracy from the provided document and provide their exact source. You operate with a step-by-step, chain-of-thought process to ensure precision.`;

    const prompt = `
CONTEXT:
---
${documentText}
---

TASK:
1.  **Define Target:** Your target is any data related to "${dataType}".
2.  **Systematic Scan:** Read through the CONTEXT from beginning to end, specifically looking for mentions of the target data and associated time periods (e.g., 'fiscal year ended...', 'six months ended...').
3.  **Extract & Verify:** For each instance found, extract the following:
    *   'figure': The exact text value (e.g., "$264.7 million", "174%").
    *   'period': The exact time period (e.g., "fiscal year ended January 31, 2020").
    *   'numericValue': The raw numerical value. If the figure is "$264.7 million", this should be 264.7. If it's "174%", it should be 174. If it is non-numeric text, this should be null.
    *   'unit': The unit of the numeric value (e.g., "million", "%", "dollars"). If no unit, this should be null.
    *   'citation': The full sentence it appeared in as a 'citation'.
4.  **Format Output:** Your response MUST be in a single, valid JSON array format. Do not add any text before or after the JSON array. Each object in the array should have five keys: "figure", "period", "numericValue", "unit", and "citation".
5.  **Not Found:** If no data for "${dataType}" is found in the CONTEXT, return an empty array [].
`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.0,
        },
    });

    return parseJsonResponse<ExtractedData[]>(response.text);
};


export const startChat = (documentText: string): GeminiChat => {
    const systemInstruction = `You are an AI financial analyst, a conversational partner for analyzing S-1 filings. Your personality is that of a meticulous, knowledgeable, and helpful hedge fund associate. You have absorbed the entire S-1 filing provided. You will engage in a multi-turn conversation, remembering previous parts of the discussion to provide contextually aware answers.

Your primary goal is to provide **clear, well-structured, and accurately cited** information. Adherence to the following formatting rules is critical for the application to parse your response correctly.

---

### **Formatting and Structure Rules**

1.  **Use Rich Markdown**: Structure your responses like a professional analysis report.
    *   **Headings**: Use \`##\` and \`###\` to create clear sections for different topics.
    *   **Emphasis**: Use **bold text** for key terms and metrics (e.g., \`**Total Revenue:**\`).
    *   **Lists**: Use bulleted (\`-\`) or numbered (\`1.\`) lists for breaking down information.
    *   **Tables**: For comparative data, always use Markdown tables.

        *Example Table:*
        \`\`\`
        ### Revenue Growth Comparison
        | Period                    | Revenue          | Year-over-Year Growth |
        | ------------------------- | ---------------- | --------------------- |
        | Fiscal Year 2020          | $264.7 million [^1] | 174% [^2]               |
        | Fiscal Year 2019          | $96.7 million [^3]  | -                     |
        \`\`\`
    *   **Formulas (LaTeX)**: When explaining a calculation, use LaTeX within dollar signs. Use \`$$\` for block-level formulas.

        *Example Formula:*
        \`\`\`
        The company's Gross Margin can be calculated using the formula:
        $$
        \\text{Gross Margin} = \\frac{(\\text{Revenue} - \\text{Cost of Revenue})}{\\text{Revenue}} \\times 100\\%
        $$
        For FY 2020, this would be... [^4]
        \`\`\`

---

### **CRITICAL CITATION RULES (Follow these EXACTLY)**

1.  **Ground ALL Claims**: Every factual claim MUST be grounded in the provided S-1 document. Do not use outside knowledge.

2.  **Citation Marker Format**:
    *   **DO**: Use Markdown footnotes. Add a unique, numbered citation marker immediately after a fact, like this: \`[^1]\`.
    *   **DO NOT**: Combine citations (e.g., \`[^1, ^2]\` is **INVALID**). List them separately if needed: \`fact one [^1] and fact two [^2]\`.
    *   **DO NOT**: Use square brackets without a caret (e.g., \`[1]\` is **INVALID**).
    *   **DO NOT**: Add extra characters (e.g., \`[*1]\` is **INVALID**).
    *   **Correct Example**: \`The revenue was $100 million [^1].\`

3.  **Citations Section**:
    *   At the **very end** of your entire response, add a section titled \`### Citations\`.
    *   Under this heading, list each citation number with its corresponding **EXACT, verbatim quote** from the S-1 document.
    *   The format must be \`[^number]: "The verbatim quote..."\`.

        *Citation Block Example:*
        \`\`\`
        ### Citations
        [^1]: "For the fiscal years ended January 31, 2019 and 2020, our revenue was $96.7 million and $264.7 million, respectively..."
        [^2]: "...representing 174% year-over-year growth."
        \`\`\`

4.  **No Answer**: If you cannot find an answer in the document, state that clearly and do not provide citations.
`;
    
    const chat = ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
            systemInstruction,
            temperature: 0.2, // Slightly increase for more nuanced language
        },
        history: [
            {
                role: 'user',
                parts: [{ text: `Here is the S-1 filing I want to discuss. Please review it and confirm you are ready.\n\n---\n${documentText}\n---` }],
            },
            {
                role: 'model',
                parts: [{ text: "Understood. I have reviewed the S-1 filing. I'm ready to answer your questions and will provide structured, detailed analysis." }],
            }
        ]
    });
    return chat;
}

export const sendMessageStream = async (chat: GeminiChat, message: string) => {
    return await chat.sendMessageStream({ message });
}

// Helper for specialist AI calls
const runSpecialistAnalysis = async <T>(systemInstruction: string, prompt: string, defaultValue: T): Promise<T> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.1,
            },
        });
        const parsed = parseJsonResponse<T>(response.text);
        return parsed ?? defaultValue;
    } catch (error) {
        console.error("Error in specialist analysis:", error);
        return defaultValue;
    }
};

export const performFinancialAnalysis = async (documentText: string): Promise<FinancialAnalysisResult | null> => {
    const contextPrompt = `CONTEXT:\n---\n${documentText}\n---`;

    // --- Specialist Prompts ---
    
    const profitabilityPrompt = `
${contextPrompt}
TASK: You are an analyst specializing in profitability. Extract and calculate the following ratios for the most recent full fiscal year mentioned. Return a valid JSON array.
- Gross Margin: (Gross Profit / Revenue) * 100%
- Operating Margin: (Operating Income / Revenue) * 100%
- Net Margin: (Net Income / Revenue) * 100%
For each, provide: metric, value, period, commentary, citation, and sentiment. If data is missing, state "Not Available".
`;

    const growthPrompt = `
${contextPrompt}
TASK: You are an analyst specializing in growth metrics. Extract the following from the document. Return a valid JSON array.
- Revenue YoY Growth
- Revenue Retention Rate
For each, provide: metric, value, period, commentary, citation, and sentiment. If data is missing, state "Not Available".
`;
    
    const liquidityPrompt = `
${contextPrompt}
TASK: You are an analyst specializing in balance sheet health. Extract and calculate the following ratios for the most recent balance sheet date. Return a valid JSON array.
- Current Ratio: (Current Assets / Current Liabilities)
- Cash Ratio: (Cash and Cash Equivalents / Current Liabilities)
- Debt-to-Equity Ratio: (Total Debt / Total Equity)
For each, provide: metric, value, period, commentary, citation, and sentiment. If data is missing, state "Not Available".
`;

    const trendPrompt = `
${contextPrompt}
TASK: You are an analyst specializing in financial trends. Analyze the Year-over-Year (YoY) change for the following line items. Return a valid JSON array.
- Revenue
- Operating Expenses
- Net Income (Loss)
For each, provide: lineItem, yoyChange, deltaVsRevenue (for OpEx, calculate as (OpEx growth % - Revenue growth %)), commentary, citation, and sentiment.
`;

    const miscPrompt = `
${contextPrompt}
TASK: You are a qualitative risk and strategy analyst. Scrutinize the document for non-numeric insights. Identify and summarize findings on the following topics: Competitive Advantages, Key Person Dependencies, Regulatory Risks, Customer Concentration, and Future Growth Catalysts. Return a valid JSON array.
For each, provide: topic, insight, citation, and sentiment.
`;

    const hiddenInsightsPrompt = `
${contextPrompt}
TASK: You are an "Investigative Financial Journalist" AI. Your job is to find financially significant details that are NOT obvious from standard financial statements. Look for things like large, multi-year purchase commitments, major lease obligations, or other unusual cash outlays mentioned in the text.
EXAMPLE: An S-1 might mention "we have a non-cancelable commitment to spend $545.0 million on cloud hosting services over the next five years." This is a huge insight!
For each finding, provide: topic, insight, significance (explain WHY it matters, e.g., "This amounts to nearly $300k/day"), and citation.
Return a valid JSON array of your findings. If none are found, return an empty array.
`;

    const ipoPrompt = `
${contextPrompt}
TASK: You are an IPO specialist. Summarize the key points for the following sections. Return a single valid JSON object.
- useOfProceeds: { summary, citation }
- customerConcentration: { summary, citation }
- shareStructure: { summary, citation }
`;

    const cashFlowPrompt = `
${contextPrompt}
TASK: You are a cash flow analyst. Analyze free cash flow, burn rate, and cash on hand. Return a single valid JSON object with a 'summary' and 'citation'.
`;

    // --- Run Specialists in Parallel ---

    const [
        profitabilityRatios,
        growthAndEfficiencyRatios,
        liquidityAndLeverageRatios,
        trendAnalysis,
        miscellaneousInsights,
        hiddenFinancialInsights,
        ipoSpecificAnalysis,
        cashFlowAnalysis
    ] = await Promise.all([
        runSpecialistAnalysis<FinancialRatio[]>(`You are a profitability analyst.`, profitabilityPrompt, []),
        runSpecialistAnalysis<FinancialRatio[]>(`You are a growth metrics analyst.`, growthPrompt, []),
        runSpecialistAnalysis<FinancialRatio[]>(`You are a balance sheet analyst.`, liquidityPrompt, []),
        runSpecialistAnalysis<TrendAnalysisItem[]>(`You are a trends analyst.`, trendPrompt, []),
        runSpecialistAnalysis<MiscellaneousInsight[]>(`You are a qualitative risk analyst.`, miscPrompt, []),
        runSpecialistAnalysis<HiddenFinancialInsight[]>(`You are an investigative financial journalist.`, hiddenInsightsPrompt, []),
        runSpecialistAnalysis<FinancialAnalysisContent['ipoSpecificAnalysis']>(`You are an IPO specialist.`, ipoPrompt, { useOfProceeds: {summary:"", citation:""}, customerConcentration: {summary:"", citation:""}, shareStructure: {summary:"", citation:""} }),
        runSpecialistAnalysis<FinancialAnalysisContent['cashFlowAnalysis']>(`You are a cash flow analyst.`, cashFlowPrompt, { summary: "", citation: "" })
    ]);

    // --- Synthesizer Step ---

    const synthesizerSystemInstruction = `You are a top-tier lead financial analyst. You have received structured data from your team of specialist analysts who reviewed an S-1 filing. Your task is to verify this data against the original document and synthesize it into a final, high-level summary.`;
    
    const synthesizerPrompt = `
ORIGINAL S-1 DOCUMENT (FOR VERIFICATION):
---
${documentText}
---

DATA FROM SPECIALIST ANALYSTS:
---
${JSON.stringify({ profitabilityRatios, growthAndEfficiencyRatios, liquidityAndLeverageRatios, trendAnalysis, miscellaneousInsights, hiddenFinancialInsights, ipoSpecificAnalysis, cashFlowAnalysis }, null, 2)}
---

TASK:
Based on a holistic review of the SPECIALIST DATA and **cross-referencing it against the ORIGINAL S-1 DOCUMENT**, generate a final JSON object. Your entire response must be only the JSON object.
1.  **"financialHealthScore"**: { "score": (0-100), "rating": "e.g., 'High Growth, High Burn'", "summary": "Brief justification for the score, citing specifics from the specialist data." }
2.  **"waterfallAnalysis"**: A JSON array for a profitability waterfall from Revenue to Net Loss for the most recent full year. Fields: "label", "value".
3.  **"overallSummary"**: A concise, high-level summary of the company's financial health, key strengths, and risks based on all available data. Ensure your summary reflects the verified findings.
`;

    const synthesizerResponse = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: synthesizerPrompt,
        config: {
            systemInstruction: synthesizerSystemInstruction,
            responseMimeType: "application/json",
            temperature: 0.2,
        },
    });

    const synthesis = parseJsonResponse<{
        financialHealthScore: FinancialAnalysisContent['financialHealthScore'];
        waterfallAnalysis: FinancialAnalysisContent['waterfallAnalysis'];
        overallSummary: string;
    }>(synthesizerResponse.text);

    if (!synthesis) {
        console.error("Failed to get a valid synthesis from the lead analyst AI.");
        return null;
    }
    
    // --- Assemble Final Result ---
    
    const finalAnalysis: FinancialAnalysisContent = {
        ...synthesis,
        profitabilityRatios,
        growthAndEfficiencyRatios,
        liquidityAndLeverageRatios,
        trendAnalysis,
        miscellaneousInsights,
        hiddenFinancialInsights,
        cashFlowAnalysis,
        ipoSpecificAnalysis
    };

    return { analysis: finalAnalysis };
};