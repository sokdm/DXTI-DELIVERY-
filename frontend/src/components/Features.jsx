import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BellRing, FileText, Image, MapPin, PackageCheck, ShieldCheck, X } from 'lucide-react';

const features = [
  {
    icon: PackageCheck,
    title: 'Shipment records',
    description: 'Find the shipment details connected to your tracking number, including sender, recipient and package information when available.',
  },
  {
    icon: BellRing,
    title: 'Recorded updates',
    description: 'Follow status changes and checkpoint notes added to your shipment’s event history.',
  },
  {
    icon: MapPin,
    title: 'Location context',
    description: 'Review recorded location details and map coordinates when they have been provided for a shipment.',
  },
  {
    icon: FileText,
    title: 'Receipt details',
    description: 'View receipt information linked to the shipment record, including the reference when one is available.',
  },
  {
    icon: ShieldCheck,
    title: 'A focused customer view',
    description: 'Shipment information is presented in a single place so it is easier to understand the latest recorded progress.',
  },
  {
    icon: BellRing,
    title: 'Customer support',
    description: 'Contact the support team with your tracking number if you need help understanding an update.',
  },
];

const galleryImages = [
  { src: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1000&q=85', title: 'Sorting and handling' },
  { src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1000&q=85', title: 'Air transport' },
  { src: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&q=85', title: 'Logistics facilities' },
  { src: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1000&q=85', title: 'Warehouse operations' },
  { src: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1000&q=85', title: 'Shipment handling' },
  { src: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1000&q=85', title: 'Cargo transport' },
  { src: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1000&q=85', title: 'Freight movement' },
  { src: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1000&q=85', title: 'Delivery vehicles' },
];

const Features = () => {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <section id="about" className="bg-white py-20 dark:bg-dhl-gray-900 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .45 }} className="max-w-2xl">
          <div className="eyebrow"><PackageCheck className="h-4 w-4" /> Your shipment workspace</div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-dhl-black dark:text-white sm:text-5xl">
            The details that matter, <span className="text-dhl-red">all together.</span>
          </h2>
          <p className="mt-5 text-base leading-7 text-dhl-gray-600 dark:text-dhl-gray-300 sm:text-lg">
            The tracking portal brings together the information recorded for each shipment. What you can see depends on the details available on that shipment.
          </p>
        </motion.div>

        <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: .38, delay: (index % 3) * .06 }}
              className="group rounded-2xl border border-dhl-gray-200/80 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-dhl-red/25 hover:shadow-xl hover:shadow-slate-900/[.05] dark:border-dhl-gray-700 dark:bg-dhl-gray-800"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-dhl-red transition group-hover:bg-dhl-red group-hover:text-white dark:bg-teal-400/10 dark:text-teal-300 dark:group-hover:bg-dhl-red dark:group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-dhl-black dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-dhl-gray-600 dark:text-dhl-gray-300">{description}</p>
            </motion.article>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl bg-dhl-gray-50 p-6 dark:bg-dhl-gray-800 sm:flex-row sm:items-center sm:px-8">
          <div>
            <p className="font-semibold text-dhl-black dark:text-white">A look at logistics in motion</p>
            <p className="mt-1 text-sm text-dhl-gray-500 dark:text-dhl-gray-400">Illustrative photography; images are not shipment-specific.</p>
          </div>
          <button type="button" onClick={() => setShowGallery(true)} className="inline-flex items-center gap-2 rounded-xl border border-dhl-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-dhl-black transition hover:border-dhl-red/30 hover:text-dhl-red dark:border-dhl-gray-600 dark:bg-dhl-gray-900 dark:text-white">
            <Image className="h-4 w-4" /> View gallery <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showGallery && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Logistics image gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] overflow-y-auto bg-dhl-black/95 p-4 backdrop-blur-md sm:p-8"
            onClick={() => { setShowGallery(false); setSelectedImage(null); }}
          >
            <div className="mx-auto max-w-7xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-300">Illustrative photography</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Logistics gallery</h3>
                </div>
                <button type="button" aria-label="Close gallery" onClick={() => { setShowGallery(false); setSelectedImage(null); }} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"><X className="h-5 w-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {galleryImages.map((image, index) => (
                  <button type="button" key={image.title} onClick={() => setSelectedImage(image)} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-white/5 text-left">
                    <img src={image.src} alt={image.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dhl-black/85 to-transparent px-3 pb-3 pt-10 text-xs font-semibold text-white sm:px-4 sm:text-sm">{image.title}</span>
                    <span className="sr-only">Image {index + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 p-4" onClick={() => setSelectedImage(null)}>
            <button type="button" aria-label="Close enlarged image" onClick={() => setSelectedImage(null)} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white"><X className="h-5 w-5" /></button>
            <img src={selectedImage.src} alt={selectedImage.title} className="max-h-[85vh] max-w-full rounded-xl object-contain" onClick={(event) => event.stopPropagation()} />
            <p className="absolute bottom-5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">{selectedImage.title}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Features;
