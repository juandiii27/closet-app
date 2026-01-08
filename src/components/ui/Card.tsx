import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden', className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('p-6', className)} {...props}>
            {children}
        </div>
    );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('p-6 pt-0', className)} {...props}>
            {children}
        </div>
    );
}
