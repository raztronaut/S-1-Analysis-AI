import React from 'react';
import { View } from '../types';

interface SidebarProps {
    activeView: View;
    setActiveView: (view: View) => void;
    fileName: string | null;
    onReset: () => void;
}

const LightBulbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.3-2.3L12.75 18l1.178-.398a3.375 3.375 0 002.3-2.3L16.5 14.25l.398 1.178a3.375 3.375 0 002.3 2.3l1.178.398-1.178.398a3.375 3.375 0 00-2.3 2.3z" />
    </svg>
);

const TableCellsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h.008v.015h-.008v-.015zm17.25 0h-.008v.015h.008v-.015zM3.375 8.25h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h.008v.015h-.008v-.015zm17.25 0h-.008v.015h.008v-.015zM9 15h.008v.015H9v-.015zm3 0h.008v.015h-.008v-.015zm3 0h.008v.015h-.008v-.015z" />
    </svg>
);

const ChatBubbleLeftRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.455.09-.934.09-1.425v-2.55A4.5 4.5 0 019 8.25v-2.25c0-1.55.93-2.857 2.146-3.58a9.025 9.025 0 015.714 0A4.492 4.492 0 0121 8.25v3.75z" />
    </svg>
);

const ChartBarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);


const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, fileName, onReset }) => {
    const navItems = [
        { id: View.SUMMARY_QA, label: 'Summary & Q/A', icon: <LightBulbIcon className="w-5 h-5 mr-3" /> },
        { id: View.DATA_EXTRACTION, label: 'Data Extraction', icon: <TableCellsIcon className="w-5 h-5 mr-3" /> },
        { id: View.FINANCIAL_ANALYSIS, label: 'Financial Analysis', icon: <ChartBarIcon className="w-5 h-5 mr-3" /> },
        { id: View.CHAT, label: 'Chat with Doc', icon: <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3" /> },
    ];

    return (
        <aside className="w-64 bg-dark-card flex-shrink-0 flex flex-col border-r border-dark-border">
            <div className="h-20 flex items-center justify-center border-b border-dark-border px-4">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-brand-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c.251-.12.52-.192.8-.256M9.75 3.104L8.25 2.25l-1.5 2.25L8.25 6l1.5-2.25L8.25 2.25zM9.75 8.818c.379.32.81.538 1.28.625l3.5-7C14.126 2.022 13.52 1.5 12.75 1.5c-.77 0-1.376.522-1.723 1.25l-3.5 7c.47.087.901.295 1.28.625zM14.25 14.5l-4.5-5.25L5 14.5m9.25 0l-4.5-5.25L5 14.5M14.25 14.5L12 12.25l-2.25 2.25M14.25 14.5l2.25-2.25L12 12.25m3.75 7.5l-4.5-5.25L9 19.5m3.75 0l-4.5-5.25L9 19.5m3.75 0l2.25-2.25L9 19.5" /></svg>
                <h1 className="text-lg font-bold text-dark-text-primary ml-2 tracking-wide">S-1 Analyst</h1>
            </div>

            <div className="p-4 border-b border-dark-border">
                <h2 className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider mb-2">Current Document</h2>
                <p className="text-sm text-dark-text-primary truncate" title={fileName ?? ''}>{fileName ?? 'No file loaded'}</p>
                <button 
                    onClick={onReset}
                    className="w-full mt-3 px-3 py-2 bg-dark-card border border-dark-border text-dark-text-secondary rounded-md text-sm hover:border-brand-primary hover:text-dark-text-primary transition-colors duration-200">
                    Load New Document
                </button>
            </div>

            <nav className="flex-grow p-4">
                 <h2 className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider mb-3">Analysis Tools</h2>
                <ul className="space-y-1.5">
                    {navItems.map(item => (
                        <li key={item.id}>
                            <button
                                onClick={() => setActiveView(item.id)}
                                className={`w-full text-left px-3 py-2.5 rounded-md flex items-center transition-colors duration-200 text-sm ${
                                    activeView === item.id 
                                        ? 'bg-brand-primary text-slate-900 font-semibold' 
                                        : 'text-dark-text-secondary hover:bg-overlay hover:text-dark-text-primary'
                                }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;