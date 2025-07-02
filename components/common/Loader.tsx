import React from 'react';

const Loader: React.FC<{ size?: string }> = ({ size = 'h-8 w-8' }) => {
    return (
        <div className="flex justify-center items-center p-4">
            <div className={`${size} animate-spin rounded-full border-4 border-dark-text-secondary/20 border-t-brand-primary`} />
        </div>
    );
};

export default Loader;