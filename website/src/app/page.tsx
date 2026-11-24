import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { CombinedStudio } from "@/components/CombinedStudio";
import { ProductsSection } from "@/components/ProductsSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { TechStackSection } from "@/components/TechStackSection";
import { PricingSection } from "@/components/PricingSection";
import { FAQSection } from "@/components/FAQSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <CombinedStudio />
        <ProductsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TechStackSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
