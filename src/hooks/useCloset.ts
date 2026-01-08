import { useContext } from 'react';
import { ClosetContext } from '../context/ClosetContext';

export function useCloset() {
    const context = useContext(ClosetContext);
    if (context === undefined) {
        throw new Error('useCloset must be used within a ClosetProvider');
    }
    return context;
}
