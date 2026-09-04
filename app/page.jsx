import { getRepoStats, formatCount } from '@/lib/github';
import { Reveal } from '@/components/Reveal';
import { StructuredData } from '@/components/StructuredData';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { DownloadFlow } from '@/components/DownloadFlow';
import { BrandBand } from '@/components/BrandBand';
import { Showcase } from '@/components/Showcase';
import { Features } from '@/components/Features';
import { Download } from '@/components/Download';
import { OpenSource } from '@/components/OpenSource';
import { Footer } from '@/components/Footer';

export default async function Page() {
  const stats = await getRepoStats();
  // console.log(stats);
  
  const stars = formatCount(stats?.stars);

  return (
    <>
      <StructuredData stats={stats} />
      <Reveal />
      {/* This wrapper is the sheet that slides up to reveal the footer
          pinned beneath it — it must carry an opaque background. */}
      <div className="page-sheet">
        <Nav stars={stars} />
        <main>
          <Hero downloads={stats?.downloads} />
          <DownloadFlow />
          <BrandBand />
          <Showcase />
          <Features />
          <Download />
          <OpenSource stats={stats} />
        </main>
      </div>
      <Footer />
    </>
  );
}
