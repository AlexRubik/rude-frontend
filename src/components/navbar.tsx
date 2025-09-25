import Link from 'next/link';
import styles from '../styles/Navbar.module.css';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    
    const WalletMultiButtonDynamic = dynamic(
        async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
        { ssr: false }
    );

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close menus on route change
    useEffect(() => {
        const handleRouteChange = () => {
            setIsOpen(false);
            setShowDropdown(false);
        };

        router.events.on('routeChangeStart', handleRouteChange);
        
        return () => {
            router.events.off('routeChangeStart', handleRouteChange);
        };
    }, [router]);

    return (
      <>
        <div className={styles.navbar} ref={navRef}>
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
              <div 
                className={styles.dropdown}
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
                onClick={() => {
                  // For mobile: toggle dropdown on click
                  if (window.innerWidth <= 768) {
                    setShowDropdown(!showDropdown);
                  }
                }}
              >
                <h4 className={styles.link}>More</h4>
                <div className={`${styles.dropdownContent} ${showDropdown ? styles.show : ''}`}>


                  <Link href="/sol-passive">
                    <h4 className={styles.dropdownLink}>Passive Yield</h4>
                  </Link>
                  <Link href="/adrena">
                    <h4 className={styles.dropdownLink}>Adrena Stats</h4>
                  </Link>
                  <Link href="/trading-calc">
                    <h4 className={styles.dropdownLink}>Trading Calc</h4>
                  </Link>
                  <Link href="/pnl-dashboard">
                    <h4 className={styles.dropdownLink}>LP Stats Alpha</h4>
                  </Link>
                </div>
              </div>
            </div>

            <div className={styles.navbarRight}>
              <WalletMultiButtonDynamic style={
                { 
                backgroundColor: '#d35033',
                height: '40px',
                fontSize: '14px'


               }
               }/>
            </div>
          </nav>
        </div>
      </>
    );
};

export default Navbar;