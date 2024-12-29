import Link from 'next/link';
import styles from '../styles/Navbar.module.css';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    const WalletMultiButtonDynamic = dynamic(
        async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
        { ssr: false }
    );

    return (
      <>
        <div className={styles.navbar}>
          <nav>
            {/* Hamburger menu button */}
            <button 
              className={styles.hamburger} 
              onClick={() => setIsOpen(!isOpen)}
            >
              ☰
            </button>

            {/* Regular and mobile nav links */}
            <div className={`${styles.navLinks} ${isOpen ? styles.showMobile : ''}`}>
              <Link href="/">
                <h4 className={styles.link}>Home</h4>
              </Link>
              <Link href="/balances">
                <h4 className={styles.link}>Balance Tracker</h4>
              </Link>
              <Link href="/source-code">
                <h4 className={styles.link}>Source Code</h4>
              </Link>
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