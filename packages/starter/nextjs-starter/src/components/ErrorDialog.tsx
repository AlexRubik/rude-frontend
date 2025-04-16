import { useState } from 'react';

import { getErrorMessage } from '../errors';

type Props = Readonly<{
    error: unknown;
    onClose?(): false | void;
    title?: string;
}>;

export function ErrorDialog({ error, onClose, title }: Props) {
    const [isOpen, setIsOpen] = useState(true);
    
    if (!isOpen) return null;
    
    const handleClose = () => {
        if (!onClose || onClose() !== false) {
            setIsOpen(false);
        }
    };
    
    return (
        <div className="error-dialog-overlay">
            <div className="error-dialog">
                <div className="error-dialog-header">
                    <h3 style={{ color: 'red' }}>{title ?? 'We encountered the following error'}</h3>
                </div>
                <div className="error-dialog-body">
                    <div className="error-message">
                        {getErrorMessage(error, 'Unknown')}
                    </div>
                </div>
                <div className="error-dialog-footer">
                    <button onClick={handleClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
