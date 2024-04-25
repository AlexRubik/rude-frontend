import Link from 'next/link';
import styles from '../styles/Navbar.module.css';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import dynamic from 'next/dynamic';

// Example in a component file
const Navbar = () => {

    const WalletMultiButtonDynamic = dynamic(
        async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
        { ssr: false }
    );
    return (
      <>
        <div className={styles.navbar}>
      <nav>
        <div className={styles.navLinks}>
        <Link href="/">
          <h4 className={styles.link}>Home</h4>
        </Link>
        <Link href="/balances">
          <h4 className={styles.link}>Balance Tracker</h4>
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