import "mapbox-gl/dist/mapbox-gl.css";
import Head from "next/head";
import type { AppProps } from "next/app";

import "../styles/globals.css";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>Bit Rainy</title>
        <meta name="description" content="How many are there where you live?" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#ffffff" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👌</text></svg>"
        />
      </Head>

      <Component {...pageProps} />
    </>
  );
};

export default App;
