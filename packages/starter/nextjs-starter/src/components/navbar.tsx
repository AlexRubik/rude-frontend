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
        <div className={styles.navbar}>
      <nav>
        <Link href="/" prefetch={true}>
          <a className={styles.link}>Home</a>
        </Link>
        <Link href="/balances" prefetch={true}>
          <a className={styles.link}>Balance Tracker</a>
        </Link>
        {/* <a className={styles.link} href='https://github.com/AlexRubik/rude-bot-solana' target="_blank" rel="noopener noreferrer">
                        GitHub
                    </a>
        <a className={styles.link} href='https://discord.gg/6DTGbMNYuA' target="_blank" rel="noopener noreferrer">
                        Discord
                    </a>
                    <a className={styles.link} href='https://rude-bot-org.gitbook.io/' target="_blank" rel="noopener noreferrer">
                        Documentation
                    </a> */}
                    <div className={styles.navbarRight}>

                    <WalletMultiButtonDynamic />
                    </div>

      </nav>
    </div>
    
    );
  };

  export default Navbar;