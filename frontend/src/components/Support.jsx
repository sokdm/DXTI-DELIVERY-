import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Mail, MessageCircle, Send } from 'lucide-react';

const contacts = [
  {
    icon: Mail,
    title: 'Email support',
    detail: 'Send your question by email',
    value: 'support@trxlogistics.com',
    href: 'mailto:support@trxlogistics.com',
  },
  {
    icon: Send,
    title: 'Telegram',
    detail: 'Message our support channel',
    value: '@TRXLogistics',
    href: 'https://t.me/TRXLogistics',
  },
];

const Support = () => (
  <section id="contact" className="bg-white py-20 dark:bg-dhl-gray-900 sm:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .45 }}>
          <div className="eyebrow"><MessageCircle className="h-4 w-4" /> Customer care</div>
          <h2 className="mt-4 max-w-lg text-3xl font-bold tracking-tight text-dhl-black dark:text-white sm:text-5xl">
            A question about your shipment?
          </h2>
          <p className="mt-5 max-w-lg leading-7 text-dhl-gray-600 dark:text-dhl-gray-300">
            Include your tracking number when you get in touch so we can help with the right shipment.
          </p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2">
          {contacts.map(({ icon: Icon, title, detail, value, href }, index) => (
            <motion.a
              key={title}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: .4, delay: index * .07 }}
              className="group rounded-2xl border border-dhl-gray-200 bg-dhl-gray-50 p-6 transition duration-200 hover:-translate-y-1 hover:border-dhl-red/30 hover:bg-white hover:shadow-xl hover:shadow-slate-900/[.06] dark:border-dhl-gray-700 dark:bg-dhl-gray-800 dark:hover:bg-dhl-gray-800"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-dhl-red dark:bg-teal-400/10 dark:text-teal-300"><Icon className="h-5 w-5" /></span>
              <div className="mt-5 flex items-center justify-between gap-4">
                <h3 className="font-semibold text-dhl-black dark:text-white">{title}</h3>
                <ArrowUpRight className="h-4 w-4 text-dhl-gray-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-dhl-red" />
              </div>
              <p className="mt-1 text-sm text-dhl-gray-500 dark:text-dhl-gray-400">{detail}</p>
              <p className="mt-4 text-sm font-semibold text-dhl-red dark:text-teal-300">{value}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default Support;
