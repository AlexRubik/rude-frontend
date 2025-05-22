import { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Load the Solana ID library in the header of your page */}
        <Script
          src="https://perk-frame-react.vercel.app/perk-frame-react.bundle.js"
          strategy="lazyOnload"
        />

      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 