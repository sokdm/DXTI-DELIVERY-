import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Globe, MapPin, Shield, Clock, Headphones, Plane, Warehouse, Truck, X, ChevronRight, Image } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Express Delivery',
    description: 'Same-day and next-day delivery options available worldwide with guaranteed speed.',
    color: 'bg-dhl-yellow',
    textColor: 'text-dhl-black',
    image: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80',
  },
  {
    icon: Plane,
    title: 'Air Freight',
    description: 'Global air cargo services with real-time tracking and customs clearance support.',
    color: 'bg-dhl-red',
    textColor: 'text-white',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
  },
  {
    icon: Truck,
    title: 'Road Transport',
    description: 'Extensive ground network covering all major cities with flexible scheduling.',
    color: 'bg-dhl-yellow',
    textColor: 'text-dhl-black',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
  },
  {
    icon: Warehouse,
    title: 'Warehousing',
    description: 'Secure storage facilities with inventory management and distribution services.',
    color: 'bg-dhl-red',
    textColor: 'text-white',
    image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
  },
  {
    icon: Globe,
    title: 'Global Coverage',
    description: 'Deliver to over 120 countries with our extensive international logistics network.',
    color: 'bg-dhl-yellow',
    textColor: 'text-dhl-black',
    image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80',
  },
  {
    icon: Shield,
    title: 'Secure Handling',
    description: 'Full insurance coverage and secure packaging for all your valuable shipments.',
    color: 'bg-dhl-red',
    textColor: 'text-white',
    image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80',
  },
];

// Gallery images
const galleryImages = [
  { src: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80', title: 'Express Sorting Facility' },
  { src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80', title: 'Air Freight Operations' },
  { src: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80', title: 'Ground Fleet' },
  { src: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80', title: 'Package Handling' },
  { src: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80', title: 'Delivery Operations' },
  { src: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80', title: 'Global Logistics' },
  { src: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=800&q=80', title: 'Container Shipping' },
  { src: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80', title: 'Warehouse Management' },
  { src: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80', title: 'Last Mile Delivery' },
  { src: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&q=80', title: 'Cold Chain Logistics' },
  { src: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80', title: 'Customs Clearance' },
  { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', title: 'Digital Tracking' },
];

const Features = () => {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <section id="about" className="py-24 bg-white dark:bg-dhl-gray-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dhl-yellow/20 dark:bg-dhl-yellow/10 border-l-4 border-dhl-yellow mb-6">
            <span className="text-dhl-yellow font-bold uppercase tracking-wider text-sm">
              Our Services
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-dhl-black dark:text-white uppercase mb-4">
            Why Choose <span className="text-dhl-red">DXTI</span>?
          </h2>
          <p className="text-lg text-dhl-gray-600 dark:text-dhl-gray-300 max-w-2xl mx-auto">
            Experience the future of logistics with our cutting-edge technology, 
            global network, and unmatched service quality.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative overflow-hidden rounded-sm shadow-lg cursor-pointer"
            >
              {/* Image background */}
              <div className="h-48 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dhl-black/80 via-dhl-black/40 to-transparent"></div>
              </div>

              {/* Content */}
              <div className="relative p-6 bg-white dark:bg-dhl-gray-900 border-b-4 border-dhl-yellow">
                <div className={`w-14 h-14 ${feature.color} flex items-center justify-center mb-4 -mt-12 relative z-10 shadow-lg`}>
                  <feature.icon className={`w-7 h-7 ${feature.textColor}`} />
                </div>

                <h3 className="text-xl font-black text-dhl-black dark:text-white uppercase mb-2">
                  {feature.title}
                </h3>

                <p className="text-dhl-gray-600 dark:text-dhl-gray-300 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gallery Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <motion.button
            onClick={() => setShowGallery(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-dhl-yellow text-dhl-black font-black uppercase tracking-wider rounded-sm shadow-lg hover:bg-dhl-yellow-light transition-all duration-300"
          >
            <Image className="w-5 h-5" />
            View Gallery
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-dhl-black/95 backdrop-blur-xl overflow-y-auto"
            onClick={() => {
              setShowGallery(false);
              setSelectedImage(null);
            }}
          >
            <div className="min-h-screen px-4 py-8">
              {/* Header */}
              <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-white uppercase">
                  DXTI <span className="text-dhl-yellow">Gallery</span>
                </h2>
                <button
                  onClick={() => setShowGallery(false)}
                  className="p-3 bg-dhl-yellow text-dhl-black rounded-sm hover:bg-dhl-yellow-light transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Gallery Grid */}
              <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryImages.map((img, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative aspect-square overflow-hidden rounded-sm cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(img);
                    }}
                  >
                    <img
                      src={img.src}
                      alt={img.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dhl-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white font-bold text-sm uppercase">{img.title}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[101] bg-dhl-black/98 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-3 bg-dhl-yellow text-dhl-black rounded-sm hover:bg-dhl-yellow-light transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={selectedImage.src}
              alt={selectedImage.title}
              className="max-w-full max-h-[85vh] object-contain rounded-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <span className="text-white font-bold text-lg uppercase tracking-wider bg-dhl-black/50 px-4 py-2 rounded-sm">
                {selectedImage.title}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Features;
