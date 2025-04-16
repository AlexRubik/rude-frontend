import type { UiWallet } from '@wallet-standard/react';
import { useDisconnect } from '@wallet-standard/react';
import { useEffect, useState } from 'react';

import { NO_ERROR } from '../errors';
import styles from '../styles/DisconnectButton.module.css';

type Props = Readonly<{
    wallet: UiWallet;
    onDisconnect?: () => void;
}>;

export function DisconnectButton({
    wallet,
    onDisconnect,
    ...buttonProps
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & Props) {
    const [isDisconnecting, disconnect] = useDisconnect(wallet);
    const [lastError, setLastError] = useState(NO_ERROR);
    const [showTooltip, setShowTooltip] = useState(false);
    
    // Show tooltip when there's an error
    useEffect(() => {
        if (lastError !== NO_ERROR) {
            setShowTooltip(true);
            
            // Auto-hide tooltip after 5 seconds
            const timer = setTimeout(() => {
                setShowTooltip(false);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [lastError]);
    
    return (
        <div className={styles.container}>
            {showTooltip && lastError !== NO_ERROR && (
                <div className={styles.tooltip}>
                    <div className={styles.tooltipContent}>
                        <strong>Error:</strong>{' '}
                        {lastError && typeof lastError === 'object' && 'message' in lastError
                            ? (lastError as Error).message
                            : String(lastError)}
                    </div>
                </div>
            )}
            
            <button
                {...buttonProps}
                className={`${styles.button} ${buttonProps.className || ''}`}
                disabled={isDisconnecting || buttonProps.disabled}
                onClick={async () => {
                    setLastError(NO_ERROR);
                    try {
                        await disconnect();
                        if (onDisconnect) onDisconnect();
                    } catch (e: any) {
                        setLastError(e);
                    }
                }}
                type="button"
            >
                {lastError === NO_ERROR ? (
                    <svg className={styles.icon} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M3 1C2.44772 1 2 1.44772 2 2V13C2 13.5523 2.44772 14 3 14H10.5C11.0523 14 11.5 13.5523 11.5 13V11.5H10.5V13H3V2H10.5V3.5H11.5V2C11.5 1.44772 11.0523 1 10.5 1H3ZM11.7536 4.89645L11.0465 5.60355L12.6893 7.25H5.5V8.25H12.6893L11.0465 9.89645L11.7536 10.6036L14.3536 8.00355L11.7536 5.40355V4.89645Z"
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                        ></path>
                    </svg>
                ) : (
                    <svg className={styles.icon} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M8.4449 0.608765C8.0183 0.368752 7.50772 0.5118 7.26772 0.938349L6.85829 1.68751C6.61829 2.11405 6.76134 2.62463 7.18788 2.86463C7.61442 3.10463 8.125 2.96158 8.365 2.53505L8.77443 1.78588C9.01444 1.35935 8.87139 0.848771 8.4449 0.608765ZM6.74304 3.81063L6.20301 4.79389C5.96301 5.22042 6.10605 5.731 6.53259 5.971C6.95913 6.211 7.46971 6.06796 7.70971 5.64142L8.24975 4.65815C8.48975 4.23162 8.3467 3.72104 7.92016 3.48104C7.49362 3.24104 6.98304 3.38409 6.74304 3.81063ZM4.45951 5.27937C4.68287 4.87316 5.18826 4.71036 5.59447 4.93372L13.0282 8.76078C13.4344 8.98414 13.5972 9.48953 13.3739 9.89574C13.1505 10.3019 12.6451 10.4647 12.2389 10.2414L4.80516 6.41433C4.39895 6.19097 4.23615 5.68558 4.45951 5.27937ZM3.86291 7.21747C3.62291 7.64401 3.76596 8.15459 4.1925 8.39459L11.2422 12.0414C11.6687 12.2814 12.1793 12.1383 12.4193 11.7118C12.6593 11.2853 12.5162 10.7747 12.0897 10.5347L5.04001 6.88788C4.61347 6.64788 4.10289 6.79093 3.86289 7.21747H3.86291ZM2.99644 8.91518C2.75644 9.34172 2.89949 9.8523 3.32603 10.0923L9.8855 13.5472C10.312 13.7872 10.8226 13.6442 11.0626 13.2176C11.3026 12.7911 11.1596 12.2805 10.733 12.0405L4.17355 8.58561C3.74701 8.34561 3.23643 8.48865 2.99643 8.91519L2.99644 8.91518Z"
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                        ></path>
                    </svg>
                )}
                <span>Disconnect</span>
            </button>
        </div>
    );
}
