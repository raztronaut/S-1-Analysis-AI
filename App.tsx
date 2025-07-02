import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import SummaryQA from './components/SummaryQA';
import DataExtraction from './components/DataExtraction';
import Chat from './components/Chat';
import FinancialAnalysis from './components/FinancialAnalysis';
import { View } from './types';
import FileUpload from './components/FileUpload';

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<View>(View.SUMMARY_QA);
    const [documentText, setDocumentText] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleDocumentLoad = (text: string, name: string) => {
        setDocumentText(text);
        setFileName(name);
    };

    const handleReset = () => {
        setDocumentText(null);
        setFileName(null);
        setActiveView(View.SUMMARY_QA);
    }

    const renderActiveView = () => {
        if (!documentText) return null;

        switch (activeView) {
            case View.SUMMARY_QA:
                return <SummaryQA documentText={documentText} />;
            case View.DATA_EXTRACTION:
                return <DataExtraction documentText={documentText} />;
            case View.FINANCIAL_ANALYSIS:
                return <FinancialAnalysis documentText={documentText} />;
            case View.CHAT:
                return <Chat documentText={documentText} />;
            default:
                return <SummaryQA documentText={documentText} />;
        }
    };

    if (!documentText) {
        return <FileUpload onDocumentLoad={handleDocumentLoad} />;
    }

    return (
        <div className="flex h-screen w-screen bg-dark-bg text-dark-text-primary font-sans">
            <Sidebar 
                activeView={activeView} 
                setActiveView={setActiveView} 
                fileName={fileName}
                onReset={handleReset}
            />
            <main className="flex-grow overflow-y-auto">
                {renderActiveView()}
            </main>
        </div>
    );
};

export default App;