import Link from 'next/link';
import styles from '../styles/Navbar.module.css';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
   const [showDropdown, setShowDropdown] = useState(false);
    
    const WalletMultiButtonDynamic = dynamic(
        async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
        { ssr: false }
    );

    return (
      <>
        <div className={styles.navbar}>
          <nav>
            <button 
              className={styles.hamburger} 
              onClick={() => setIsOpen(!isOpen)}
            >
              ☰
            </button>

            <div className={`${styles.navLinks} ${isOpen ? styles.showMobile : ''}`}>
              <Link href="/">
                <h4 className={styles.link}>Home</h4>
              </Link>
              <Link href="/apy-dashboard">
                <h4 className={styles.link}>APY Dashboard</h4>
              </Link>
              <Link href="/lsts">
                <h4 className={styles.link}>LSTs</h4>
              </Link>
              <div 
                className={styles.dropdown}
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <h4 className={styles.link}>More</h4>
                {showDropdown && (
                  <div className={styles.dropdownContent}>
                    <Link href="/balances">
                      <h4 className={styles.dropdownLink}>Balance Tracker</h4>
                    </Link>
                    <Link href="/trading-calc">
                      <h4 className={styles.dropdownLink}>Trading Calc</h4>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.navbarRight}>
              <WalletMultiButtonDynamic />
            </div>
          </nav>
        </div>
      </>
    );
};

export default Navbar;