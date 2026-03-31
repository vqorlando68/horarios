'use client';
import React, { createContext, useState, useContext, useEffect } from 'react';
import DocumentationModal from '../components/DocumentationModal';

const DatabaseDocsContext = createContext();

export const useDatabaseDocs = () => useContext(DatabaseDocsContext);

export const DatabaseDocsProvider = ({ children }) => {
    const [screenDocs, setScreenDocs] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
                e.preventDefault(); // Prevent default browser action if any
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <DatabaseDocsContext.Provider value={{ setScreenDocs }}>
            {children}
            {isOpen && <DocumentationModal docs={screenDocs} onClose={() => setIsOpen(false)} />}
        </DatabaseDocsContext.Provider>
    );
};
