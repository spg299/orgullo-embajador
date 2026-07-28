import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import PassionVideos from "@/components/home/PassionVideos";
import HomeMatchesCalendar from "@/components/home/HomeMatchesCalendar";
import Benefits from "@/components/home/Benefits";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <PassionVideos />
        <HomeMatchesCalendar />
        <Benefits />
        <HowItWorks />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
