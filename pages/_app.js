import Head from 'next/head';
export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=1440" />
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
            body { overflow: hidden !important; }

            /* Hide zone list entirely */
            .bmw-zonelist { display: none !important; }

            /* Hide data quality legend entirely */
            .bmw-legend { display: none !important; }

            /* Header: single compact row */
            .bmw-header {
              height: 56px !important;
              min-height: 56px !important;
              flex-wrap: nowrap !important;
              padding: 0 8px !important;
              gap: 0 !important;
              align-items: center !important;
              overflow: hidden !important;
            }

            /* Buttons: hide on mobile, use dots only */
            .bmw-buttons { display: none !important; }

            /* CarView: full width, below header, leave 45vh for bottom sheet */
            .bmw-carview {
              left: 0 !important;
              right: 0 !important;
              top: 56px !important;
              bottom: 0 !important;
            }

            /* Data panel: bottom sheet — 45vh, car always visible above */
            .bmw-datapanel {
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              top: auto !important;
              bottom: 0 !important;
              height: 48vh !important;
              max-height: 48vh !important;
              border-radius: 16px 16px 0 0 !important;
              border-left: none !important;
              border-right: none !important;
              border-bottom: none !important;
              z-index: 50 !important;
            }

            /* View switcher: visible, full width, below header */
            .bmw-viewswitcher {
              padding: 4px 8px !important;
            }

            /* Info panel: bottom sheet same treatment */
            .bmw-infopanel {
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              top: auto !important;
              bottom: 0 !important;
              height: 55vh !important;
              max-height: 55vh !important;
              border-radius: 16px 16px 0 0 !important;
              z-index: 50 !important;
            }
          }

        `}</style>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
