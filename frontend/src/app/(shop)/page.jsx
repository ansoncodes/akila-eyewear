"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Inter, Playfair_Display } from "next/font/google";
import { Hand, RotateCcw, ScanFace, Facebook, Instagram, Twitter } from "lucide-react";

import { productsApi } from "@/lib/api/services";
import { formatPrice, imageUrl } from "@/lib/utils";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-home-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-home-sans",
});

const marqueeText =
  "LIGHTWEIGHT FRAMES · HANDCRAFTED ACETATE · UV400 PROTECTION · FREE SHIPPING · 30-DAY RETURNS ·";

const collectionArtwork = [
  "/images/glassesshop-Jhnz5CcrzgQ-unsplash.jpg",
  "/images/close-up-portrait-dark-skinned-adult-man-with-thick-bristle-smiles-toothy-wears-big-optical-glasses-striped-jumper-glad-meet-friend.jpg",
  "/images/zeelool-glasses-eIE2Oikd4E0-unsplash.jpg",
];

const collectionFallbackNames = ["Foundations", "Studio Optics", "Sunset Series"];

const productPlaceholders = [
  "/images/zeelool-glasses-9nbzZ8ZimU0-unsplash.jpg",
  "/images/zeelool-glasses-eIE2Oikd4E0-unsplash.jpg",
];

const footerLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Profile", href: "/profile" },
];

const baseReveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.65, ease: "easeOut" },
};

function CollectionCard({ image, name, href, className, loading, imageClassName = "object-cover" }) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`group relative overflow-hidden rounded-[2rem] shadow-[0_18px_40px_rgba(79,49,32,0.12)] ${className}`}
    >
      <Link href={href} aria-label={`Explore ${name}`} className="absolute inset-0 z-20" />
      <Image src={image} alt={name} fill sizes="(max-width: 1024px) 100vw, 50vw" className={imageClassName} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-10 p-6">
        <p
          className={`text-3xl text-white [font-family:var(--font-home-serif)] transition-opacity duration-300 ${
            loading ? "opacity-60" : "opacity-100"
          }`}
        >
          {name}
        </p>
      </div>
    </motion.article>
  );
}

function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.6rem] bg-[#fffdf9] shadow-[0_16px_34px_rgba(89,63,49,0.1)]">
      <div className="aspect-[4/3] animate-pulse bg-[#f0e8df]" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#efe5db]" />
        <div className="h-4 w-1/3 animate-pulse rounded-full bg-[#efe5db]" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: collections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ["home-collections"],
    queryFn: productsApi.collections,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["home-products"],
    queryFn: () => productsApi.list(),
  });

  const collectionCards = useMemo(() => {
    const names = collections.map((item) => item.name);
    return collectionArtwork.map((image, index) => ({
      image,
      name: names[index] || collectionFallbackNames[index],
      href: { pathname: "/shop", query: { collection: names[index] || collectionFallbackNames[index] } },
    }));
  }, [collections]);

  const bestSellers = useMemo(() => {
    const active = products.filter((item) => item.is_active);
    return (active.length ? active : products).slice(0, 4);
  }, [products]);

  return (
    <div className={`${serif.variable} ${sans.variable} bg-[#FAF8F5] text-[#1e1b18] [font-family:var(--font-home-sans)]`}>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="grid min-h-[calc(100svh-8rem)] w-full items-center gap-8 overflow-x-clip pl-4 pr-0 pb-8 pt-24 sm:pl-8 sm:pr-0 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:pl-12 lg:pr-0"
      >
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: "easeOut" }}
          className="order-2 max-w-[540px] space-y-7 lg:order-1"
        >
          <p className="text-xs tracking-[0.24em] text-[#9b6f58]">NEW COLLECTION 2026</p>
          <h1 className="text-5xl leading-[1.05] text-[#241a15] [font-family:var(--font-home-serif)] sm:text-6xl lg:text-7xl">
            See The World
            <br />
            Differently.
          </h1>
          <p className="max-w-[36ch] text-base text-[#5f5048] sm:text-lg">
            Frames that move with you — crafted for every face, every mood.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-[#C4714F] px-7 py-3 text-sm font-semibold text-[#fff8f2] shadow-[0_12px_28px_rgba(196,113,79,0.35)] transition hover:-translate-y-0.5 hover:bg-[#b96543]"
            >
              Shop Now
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.18, ease: "easeOut" }}
          className="order-1 relative h-[62vh] min-h-[420px] overflow-hidden rounded-l-[2.4rem] rounded-r-none shadow-[0_30px_60px_rgba(95,67,50,0.14)] sm:h-[70vh] lg:order-2 lg:h-[calc(100svh-8rem)] lg:rounded-l-[4rem] lg:rounded-r-none"
        >
          <Image
            src="/images/confident-caucasian-girl-dark-sunglasses-looking-distance-outdoor-shot-good-humoured-fashionable-woman.jpg"
            alt="Model wearing Akila sunglasses"
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
            priority
          />
        </motion.div>
      </motion.section>

      <section className="overflow-hidden border-y border-[#efe2d7] bg-[#f1e8df] py-3">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          className="flex w-max gap-8 whitespace-nowrap text-sm tracking-[0.15em] text-[#C4714F]"
        >
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
        </motion.div>
      </section>

      <motion.section id="collections" {...baseReveal} className="mx-auto w-full max-w-[1380px] px-4 py-20 sm:px-8 lg:px-12">
        <h2 className="mb-8 text-4xl text-[#221a16] [font-family:var(--font-home-serif)] sm:text-5xl">
          Explore Collections
        </h2>

        <div className="grid gap-6 lg:grid-cols-[60%_40%]">
          <CollectionCard
            image={collectionCards[0].image}
            name={collectionCards[0].name}
            href={collectionCards[0].href}
            loading={collectionsLoading}
            className="h-[520px]"
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            <CollectionCard
              image={collectionCards[1].image}
              name={collectionCards[1].name}
              href={collectionCards[1].href}
              loading={collectionsLoading}
              className="h-[247px]"
            />
            <CollectionCard
              image={collectionCards[2].image}
              name={collectionCards[2].name}
              href={collectionCards[2].href}
              loading={collectionsLoading}
              className="h-[247px]"
              imageClassName="object-cover object-[center_18%]"
            />
          </div>
        </div>
      </motion.section>

      <motion.section {...baseReveal} className="mx-auto w-full max-w-[1380px] px-4 pb-20 sm:px-8 lg:px-12">
        <div className="mb-9">
          <h2 className="text-4xl text-[#221a16] [font-family:var(--font-home-serif)] sm:text-5xl">Bestsellers</h2>
          <p className="mt-3 text-[#6e5d54]">Frames people keep coming back for</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {productsLoading
            ? Array.from({ length: 4 }).map((_, index) => <ProductSkeleton key={index} />)
            : bestSellers.map((product, index) => {
                const primaryImage =
                  product.images.find((item) => item.is_primary)?.image || product.images[0]?.image || null;
                const cardImage = primaryImage ? imageUrl(primaryImage) : productPlaceholders[index % 2];
                const displayPrice = product.discount_price ?? product.price;

                return (
                  <motion.article
                    key={product.id}
                    whileHover={{ y: -7 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="group overflow-hidden rounded-[1.6rem] bg-[#fffdf9] shadow-[0_16px_34px_rgba(89,63,49,0.1)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Link href={`/product/${product.id}`} aria-label={product.name} className="absolute inset-0 z-10" />
                      <Image
                        src={cardImage}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        className="object-contain p-4 mix-blend-multiply transition duration-500 group-hover:scale-[1.04]"
                        unoptimized={cardImage.startsWith("http")}
                      />
                      <Link
                        href={`/try-on/${product.id}`}
                        className="absolute right-3 top-3 z-20 rounded-full border border-[#dbb39f] bg-[#fffaf6]/90 px-3 py-1 text-xs font-medium text-[#a76040] opacity-0 transition group-hover:opacity-100"
                      >
                        Try On
                      </Link>
                    </div>

                    <div className="space-y-2 p-5">
                      <h3 className="text-lg text-[#2f221c]">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-[#3a2a22]">{formatPrice(displayPrice)}</span>
                        {product.discount_price ? (
                          <span className="text-sm text-[#9c8b82] line-through">{formatPrice(product.price)}</span>
                        ) : null}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
        </div>
      </motion.section>

      <motion.section {...baseReveal} className="relative h-[500px] overflow-hidden">
        <Image
          src="/images/close-up-portrait-stylish-bearded-man.jpg"
          alt="Editorial eyewear banner"
          fill
          sizes="100vw"
          className="object-cover object-[center_60%]"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <h2 className="max-w-4xl text-4xl leading-tight text-white [font-family:var(--font-home-serif)] sm:text-6xl">
            Confidence is the best accessory.
          </h2>
          <Link href="/shop" className="mt-6 text-sm font-medium tracking-[0.1em] text-[#fce9dc]">
            Shop the look →
          </Link>
        </div>
      </motion.section>

      <motion.section {...baseReveal} className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08]">
          <Image
            src="/images/joylynn-goh-nKiWq-CtfiM-unsplash.jpg"
            alt="Akila craftsmanship texture"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>

        <div className="relative mx-auto w-full max-w-[1380px] px-4 py-24 sm:px-8 lg:px-12">
          <h2 className="mb-12 text-4xl text-[#221a16] [font-family:var(--font-home-serif)] sm:text-5xl">
            Why Akila
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            <div className="space-y-4">
              <Hand className="h-12 w-12 text-[#C4714F]" strokeWidth={1.4} />
              <h3 className="text-2xl text-[#2d211b] [font-family:var(--font-home-serif)]">Handcrafted Frames</h3>
              <p className="text-[#64534a]">Every pair shaped with care, built to outlast trends.</p>
            </div>
            <div className="space-y-4">
              <ScanFace className="h-12 w-12 text-[#C4714F]" strokeWidth={1.4} />
              <h3 className="text-2xl text-[#2d211b] [font-family:var(--font-home-serif)]">Try Before You Buy</h3>
              <p className="text-[#64534a]">
                See how any frame looks on your face before it arrives at your door.
              </p>
            </div>
            <div className="space-y-4">
              <RotateCcw className="h-12 w-12 text-[#C4714F]" strokeWidth={1.4} />
              <h3 className="text-2xl text-[#2d211b] [font-family:var(--font-home-serif)]">Free Returns, Always</h3>
              <p className="text-[#64534a]">Not in love? Send it back. No questions, no hassle.</p>
            </div>
          </div>
        </div>
      </motion.section>

      <footer className="border-t border-[#eadccf] bg-[#f8f2eb]">
        <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-6 px-4 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <p className="text-xl text-[#2d211b] [font-family:var(--font-home-serif)]">Akila</p>

          <nav className="flex flex-wrap items-center gap-5 text-sm text-[#6b594f]">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-[#C4714F]">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-[#6b594f]">
            <a href="#" className="transition hover:text-[#C4714F]" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" className="transition hover:text-[#C4714F]" aria-label="Facebook">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" className="transition hover:text-[#C4714F]" aria-label="Twitter">
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
        <p className="pb-8 text-center text-xs tracking-wide text-[#8f7e74]">
          © 2025 Akila Eyewear. Crafted with care.
        </p>
      </footer>
    </div>
  );
}
