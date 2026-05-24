import type { Metadata } from 'next';
import Hero from '@/components/home/Hero';
import BrandStory from '@/components/home/BrandStory';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import ExperienceAndTrust from '@/components/home/ExperienceAndTrust';
import SocialProof from '@/components/home/SocialProof';

export const metadata: Metadata = {
  title: 'Tradition Crafted by Hand',
  description:
    'Discover Artisanal Henna — premium organic henna cones, powders, bridal kits, and accessories handcrafted using ancient techniques. Free shipping over ₹999.',
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <BrandStory />
      <ExperienceAndTrust />
      <FeaturedProducts />
      <SocialProof />
    </>
  );
}
