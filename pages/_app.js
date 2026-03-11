import Head from 'next/head';
export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          @font-face {
            font-family: 'BPdots';
            src: url('/fonts/BPdots.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #060a10; overflow: hidden; font-family: 'Space Grotesk', sans-serif; }
        `}</style>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
