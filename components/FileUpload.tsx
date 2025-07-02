import React, { useState, useCallback } from 'react';
import { S1_SAMPLE_TEXT } from '../data/s1Sample';
import Loader from './common/Loader';

// Extend the Window interface to include pdfjsLib
declare global {
    interface Window {
        pdfjsLib: any;
    }
}

interface FileUploadProps {
    onDocumentLoad: (text: string, fileName: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDocumentLoad }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const processPdf = useCallback(async (file: File) => {
        if (!file || file.type !== 'application/pdf') {
            setError('Please upload a valid PDF file.');
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            // Set the worker source for pdf.js
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
            
            const reader = new FileReader();
            reader.onload = async (event) => {
                const arrayBuffer = event.target?.result;
                if (!arrayBuffer) {
                     setError('Could not read file.');
                     setIsLoading(false);
                     return;
                }
                const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((s: any) => s.str).join(' ');
                    fullText += pageText + '\n\n';
                }
                onDocumentLoad(fullText, file.name);
            };
            reader.onerror = () => {
                 setError('Failed to read the file.');
                 setIsLoading(false);
            }
            reader.readAsArrayBuffer(file);
        } catch (e) {
            console.error(e);
            setError('An error occurred while parsing the PDF.');
            setIsLoading(false);
        }
    }, [onDocumentLoad]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processPdf(e.target.files[0]);
        }
    };
    
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processPdf(e.dataTransfer.files[0]);
        }
    }, [processPdf]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

     const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleLoadSample = () => {
        setIsLoading(true);
        setError(null);
        setTimeout(() => {
            onDocumentLoad(S1_SAMPLE_TEXT, 'Snowflake_S1_Sample.txt');
        }, 500); // Simulate loading
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background text-text-primary">
            <div className="w-full max-w-2xl mx-auto text-center p-8">
                <div className="mb-10">
                    <h1 className="text-5xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">S-1 Analyst AI</h1>
                    <p className="text-lg text-text-secondary">Upload an S-1 filing in PDF format to begin your automated analysis.</p>
                </div>

                {isLoading ? (
                    <div>
                        <Loader size="h-12 w-12" />
                        <p className="mt-4 text-text-secondary animate-pulse">Processing document, please wait...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`relative border-2 border-dashed rounded-2xl p-10 transition-colors duration-300 ${isDragging ? 'border-primary bg-dark-card' : 'border-dark-border bg-dark-card/50'}`}
                        >
                             <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-text-secondary transition-colors duration-300">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                <span className="font-semibold text-primary text-lg">Click to upload or drag and drop</span>
                                <span className="text-text-secondary text-sm">PDF format only</span>
                            </label>
                        </div>

                        <div className="flex items-center space-x-4">
                            <hr className="flex-grow border-dark-border" />
                            <span className="text-text-secondary font-semibold">OR</span>
                            <hr className="flex-grow border-dark-border" />
                        </div>

                        <button
                            onClick={handleLoadSample}
                            className="w-full py-3 px-4 bg-dark-card border border-dark-border text-text-secondary rounded-lg hover:border-primary hover:text-text-primary transition-all duration-300"
                        >
                            Analyze Sample Document
                        </button>

                        {error && <p className="text-destructive mt-4">{error}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;