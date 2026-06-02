// src/pages/Home.jsx
import Hero from '../components/layout/Hero';
import FeaturedProduct from '../components/home/FeaturedProduct';
import FAQSection from '../components/home/FAQSection';
import BrandsSection from '../components/home/BrandsSection';

export default function Home() {
  return (
    <div className="bg-dark-bg">
      <Hero />
      <FeaturedProduct />
      <FAQSection />
      <BrandsSection />
    </div>
  );
}