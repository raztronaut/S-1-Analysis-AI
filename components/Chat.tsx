import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Card from './common/Card';
import { startChat, sendMessageStream } from '../services/geminiService';
import type { ChatMessage, GeminiChat } from '../types';
import CitationTooltip from './common/CitationTooltip';

interface ChatProps {
    documentText: string;
}

const ModelResponse: React.FC<{ text: string }> = ({ text }) => {
    const { processedText, citations } = useMemo(() => {
        const citationRegex = /\[\^(\d+)\]:\s*(.*)/g;
        const citationsMap = new Map<string, string>();
        if (!text) {
            return { processedText: '', citations: citationsMap };
        }

        let match;
        while ((match = citationRegex.exec(text)) !== null) {
            citationsMap.set(match[1], match[2].replace(/^"|"$/g, '').trim());
        }
        
        // Remove the citation definition block from the text to be rendered.
        let unprocessedText = text.replace(/(\r\n|\n|\r)*###? Citations\s*(\r\n|\n|\r)*/i, '');
        unprocessedText = unprocessedText.replace(/\[\^(\d+)\]:.*/g, '');

        // --- Pre-processing to fix common model deviations before passing to markdown parser ---
        let fixedText = unprocessedText
            // Handles [1] -> [^1] (but not part of a definition like [^1]:)
            .replace(/\[(\d+)\](?!:)/g, '[^$1]')
            // Handles [^1, ^2] -> [^1] [^2]
            .replace(/\[\^(\d+),\s*\^(\d+)\]/g, '[^$1] [^$2]')
            // Handles [^1, ^2, ^3] -> [^1] [^2] [^3]
            .replace(/\[\^(\d+),\s*\^(\d+),\s*\^(\d+)\]/g, '[^$1] [^$2] [^$3]');


        return { processedText: fixedText.trim(), citations: citationsMap };
    }, [text]);

    const markdownComponents = {
        sup({ node, ...props }: any) {
            const link = node?.children?.[0];
            if (link?.tagName === 'a' && link.properties?.['data-footnote-ref'] !== undefined) {
                const refNumber = link.children?.[0]?.value;
                const citationText = refNumber ? citations.get(refNumber) : null;
        
                if (citationText) {
                    // Render the number, then the icon tooltip.
                    return (
                        <>
                            <sup className="text-brand-primary font-bold no-underline">[{refNumber}]</sup>
                            <CitationTooltip text={citationText} />
                        </>
                    );
                }
            }
            return <sup {...props} />;
        },
        section(props: any) {
            if (props['data-footnotes']) {
                return null;
            }
            return <section {...props} />;
        },
        table: ({node, ...props}: any) => <div className="overflow-x-auto my-4"><table className="min-w-full" {...props} /></div>,
        thead: ({node, ...props}: any) => <thead className="border-b-2 border-dark-border" {...props} />,
        th: ({node, ...props}: any) => <th className="px-4 py-3 text-left font-semibold text-dark-text-primary" {...props} />,
        tr: ({node, ...props}: any) => <tr className="border-b border-dark-border last:border-b-0" {...props} />,
        td: ({node, ...props}: any) => <td className="px-4 py-3 align-top text-dark-text-secondary" {...props} />,
        h2: ({node, ...props}: any) => <h2 className="text-xl font-semibold text-dark-text-primary mt-6 mb-3 pb-2 border-b border-dark-border" {...props} />,
        h3: ({node, ...props}: any) => <h3 className="text-lg font-semibold text-dark-text-primary mt-4 mb-2" {...props} />,
    };

    return (
        <div className="prose prose-sm prose-invert max-w-none
            prose-p:my-3 prose-p:text-dark-text-secondary
            prose-headings:text-dark-text-primary
            prose-strong:text-dark-text-primary
            prose-a:text-brand-primary
            prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4
            prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4
            prose-li:my-1.5
            prose-blockquote:border-l-4 prose-blockquote:border-brand-primary prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:italic
        ">
            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {processedText}
            </ReactMarkdown>
        </div>
    );
};


const Chat: React.FC<ChatProps> = ({ documentText }) => {
    const [chat, setChat] = useState<GeminiChat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (documentText) {
            const initialChat = startChat(documentText);
            setChat(initialChat);
            setMessages([
                { id: 'init', role: 'model', text: "I've reviewed the S-1 filing. How can I help you analyze it?" }
            ]);
        }
    }, [documentText]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || !chat || isLoading) return;

        const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        const modelMessageId = (Date.now() + 1).toString();
        const modelMessagePlaceholder: ChatMessage = { id: modelMessageId, role: 'model', text: '', isStreaming: true };
        setMessages(prev => [...prev, modelMessagePlaceholder]);

        try {
            const stream = await sendMessageStream(chat, input);
            let streamedText = '';
            for await (const chunk of stream) {
                streamedText += chunk.text;
                setMessages(prev => prev.map(msg => 
                    msg.id === modelMessageId ? { ...msg, text: streamedText } : msg
                ));
            }
            setMessages(prev => prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, isStreaming: false } : msg
            ));

        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = { id: (Date.now() + 2).toString(), role: 'model', text: 'Sorry, I encountered an error. Please try again.' };
             setMessages(prev => {
                const newMessages = prev.filter(msg => msg.id !== modelMessageId);
                return [...newMessages, errorMessage];
            });
        } finally {
            setIsLoading(false);
        }
    }, [input, chat, isLoading]);

    return (
        <div className="p-8 flex flex-col h-full max-h-full">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-dark-text-primary">Chat with S-1 Filing</h2>
                <p className="text-dark-text-secondary text-lg mt-1">Have a conversation with your AI financial analyst.</p>
            </div>
            
            <Card className="flex-grow flex flex-col overflow-hidden !p-0">
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                           {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-brand-secondary flex items-center justify-center flex-shrink-0 font-bold text-slate-900 text-sm mt-1">AI</div>}
                            <div className={`max-w-2xl px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-primary text-slate-900 font-medium rounded-br-none' : 'bg-overlay text-dark-text-primary rounded-bl-none'}`}>
                                {msg.role === 'user' ? (
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                ) : (
                                    <ModelResponse text={msg.text} />
                                )}
                                {msg.isStreaming && msg.text.length === 0 && <span className="inline-block w-2 h-2 ml-1 bg-dark-text-primary rounded-full animate-pulse"></span>}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="mt-auto p-4 border-t border-dark-border bg-dark-card rounded-b-xl">
                    <div className="flex items-center gap-3">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Ask a follow-up question..."
                            className="flex-grow p-3 bg-surface border border-dark-border rounded-lg text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition resize-none"
                            disabled={isLoading}
                            rows={1}
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()}
                            className="w-11 h-11 flex-shrink-0 flex items-center justify-center bg-brand-primary text-slate-900 rounded-lg hover:bg-opacity-80 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.826L11.25 8.25l-7.457-3.268a.75.75 0 00-.688-.693zM12.75 8.25l-7.457 3.268a.75.75 0 00.688.693l7.457 3.268a.75.75 0 00.826-.95l-1.414-4.949a.75.75 0 00-.95-.826z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Chat;