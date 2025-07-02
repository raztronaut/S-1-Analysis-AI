import React from 'react';
import Tooltip from './Tooltip';

interface CitationTooltipProps {
    text: string;
}

const CitationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const CitationTooltip: React.FC<CitationTooltipProps> = ({ text }) => {
    if (!text) return null;

    return (
        <Tooltip text={`"${text}"`}>
            <span className="inline-block ml-1.5 text-dark-text-secondary/70 cursor-pointer hover:text-brand-primary transition-colors duration-200 align-text-bottom">
                <CitationIcon className="w-3.5 h-3.5" />
            </span>
        </Tooltip>
    );
};

export default CitationTooltip;