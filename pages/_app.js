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
          @media (max-width: 768px) {
            body { overflow: auto !important; }
            .bmw-zonelist { display: none !important; }
            .bmw-carview {
              left: 0 !important;
              right: 0 !important;
              top: 80px !important;
              bottom: 44px !important;
            }
            .bmw-datapanel {
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              top: 80px !important;
              bottom: 0 !important;
              border-radius: 0 !important;
              max-height: calc(100vh - 80px) !important;
            }
            .bmw-infopanel {
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              top: 80px !important;
              max-height: calc(100vh - 80px) !important;
              border-radius: 0 !important;
            }
            .bmw-buttons {
              right: 4px !important;
              top: 84px !important;
            }
            .bmw-legend {
              font-size: 7px !important;
              padding: 4px 6px !important;
              gap: 6px !important;
              bottom: 4px !important;
            }
            .bmw-header {
              height: auto !important;
              min-height: 80px !important;
              flex-wrap: wrap !important;
              padding: 6px 10px !important;
              gap: 4px !important;
              align-items: flex-start !important;
            }
          }

        `}</style>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
