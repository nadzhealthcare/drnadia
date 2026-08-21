import Preloader from "@/components/Preloader";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollBackground from "@/components/ScrollBackground";
import Cursor from "@/components/Cursor";
import BackgroundMusic from "@/components/BackgroundMusic";
import SocialDock from "@/components/SocialDock";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Statement from "@/components/Statement";
import Bands from "@/components/Bands";
import Journey from "@/components/Journey";
import BigQuote from "@/components/BigQuote";
import Recognition from "@/components/Recognition";
import Process from "@/components/Process";
import Detail from "@/components/Detail";
import Contact from "@/components/Contact";

export default function Page() {
  return (
    <>
      <SmoothScroll />
      <Preloader />
      <ScrollBackground />
      <Cursor />
      <Nav />
      <BackgroundMusic />
      <SocialDock />

      <main id="top">
        <Hero />
        <Statement />
        <Bands />
        <Journey />
        <BigQuote />
        <Recognition />
        <Process />
        <Detail />
        <Contact />
      </main>
    </>
  );
}
