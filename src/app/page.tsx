import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import PassionVideos from "@/components/home/PassionVideos";
import UpcomingMatches from "@/components/home/UpcomingMatches";
import Benefits from "@/components/home/Benefits";
import HowItWorks from "@/components/home/HowItWorks";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <PassionVideos />
        <UpcomingMatches />
        <Benefits />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
