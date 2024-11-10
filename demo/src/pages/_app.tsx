import "mapbox-gl/dist/mapbox-gl.css";
import Head from "next/head";
import type { AppProps } from "next/app";

import "../styles/globals.css";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>Bit Rainy</title>
        <meta name="description" content="Find somewhere better!" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="twitter:site" content="@chrisarderne" />
        <meta name="twitter:creator" content="@chrisarderne" />
        <meta name="twitter:title" content="Bit Rainy?" />
        <meta name="twitter:description" content="Find somewhere better!" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://rainy.rdrn.me/rainy.png" />

        <meta property="og:image" content="https://rainy.rdrn.me/rainy.png" />
        <meta property="og:locale" content="en_UK" />
        <meta property="og:site_name" content="Bit Rainy?" />
        <meta property="og:title" content="Bit Rainy?" />
        <meta property="og:description" content="Find somewhere better!" />

        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>☔️</text></svg>"
        />
      </Head>

      <Component {...pageProps} />
    </>
  );
};

export default App;
