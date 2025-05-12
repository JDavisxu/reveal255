import type { NextPage } from "next";
import Head from "next/head";
import { PlayView } from "../views/playView";

const Play: NextPage = () => (
  <>
    <Head>
      <title>Reveal255 • Play</title>
      <meta name="description" content="Play Reveal255" />
    </Head>
    <PlayView />
  </>
);

export default Play;
