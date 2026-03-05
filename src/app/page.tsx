'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Mic, ShieldCheck, Zap, TrendingUp, ChevronRight, Store, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const getDashboardPath = (role: string | undefined) => {
    switch (role) {
      case 'SUPERVISOR': return '/admin';
      case 'PRODUCER': return '/producteur';
      case 'COOPERATIVE': return '/cooperative';
      case 'FIELD_AGENT': return '/agent';
      case 'MERCHANT':
      default: return '/commercant';
    }
  };

  React.useEffect(() => {
    if (isAuthenticated && user) {
      router.push(getDashboardPath(user.role));
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 overflow-hidden">
      {/* Navigation Minimaliste */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg">
            <Store className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <span className="font-black text-sm xs:text-base sm:text-xl tracking-tighter text-slate-900 dark:text-white uppercase truncate">
            Inclusion<span className="text-emerald-600">Marchand</span>
          </span>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="flex-shrink-0 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-black text-[9px] sm:text-xs uppercase tracking-wider sm:tracking-widest shadow-xl active:scale-95 transition-all"
        >
          Connexion
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mb-4 sm:mb-6">
            L'IA au service du Marché Ivoirien
          </span>
          <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-8xl font-black text-slate-900 dark:text-white leading-[0.95] sm:leading-[0.9] tracking-tighter mb-6 sm:mb-8">
            DIGITALISEZ <br />
            <span className="text-emerald-600">VOTRE COMMERCE</span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium mb-8 sm:mb-12 px-2">
            L'assistant vocal révolutionnaire qui permet aux marchands informels de gérer stocks, ventes et dettes sans effort. Simple, sécurisé, et piloté à la voix.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <button
              onClick={() => router.push('/signup')}
              className="w-full sm:w-auto bg-emerald-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] font-black text-base sm:text-lg uppercase tracking-tight shadow-[0_20px_40px_rgba(5,150,105,0.3)] hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Créer ma Boutique <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-8 sm:px-10 py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] font-black text-base sm:text-lg uppercase tracking-tight border-2 border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
            >
              Déjà membre ?
            </button>
          </div>
        </motion.div>

        {/* Abstract Visual Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Mic,
              title: "Vocal-First",
              desc: "Inutile d'écrire. Dites simplement ce que vous vendez ou recevez, l'IA s'occupe de tout.",
              color: "bg-blue-500"
            },
            {
              icon: ShieldCheck,
              title: "Sécurité Wave",
              desc: "Accès sécurisé par code PIN à 4 chiffres. Verrouillage automatique pour protéger vos comptes.",
              color: "bg-emerald-500"
            },
            {
              icon: Zap,
              title: "Temps Réel",
              desc: "Vos stocks et votre argent sont synchronisés instantanément sur tous vos appareils.",
              color: "bg-amber-500"
            }
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="bg-white dark:bg-slate-800 p-10 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700 group hover:shadow-2xl hover:border-emerald-500/20 transition-all"
            >
              <div className={`w-16 h-16 ${feat.color} rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                <feat.icon size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">{feat.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                "{feat.desc}"
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[50px] p-12 md:p-24 text-center relative overflow-hidden text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 sm:mb-8 leading-tight">Prêt à faire grandir votre commerce ?</h2>
            <p className="text-lg sm:text-xl text-slate-400 font-medium mb-8 sm:mb-12 max-w-xl mx-auto italic">
              Rejoignez des centaines de marchands qui modernisent leur gestion quotidienne avec une simplicité déconcertante.
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="w-full sm:w-auto bg-emerald-500 text-white px-8 sm:px-12 py-5 sm:py-6 rounded-[24px] sm:rounded-[30px] font-black text-lg sm:text-xl uppercase tracking-widest shadow-xl hover:bg-emerald-400 active:scale-95 transition-all"
            >
              Commencer l'aventure
            </button>
          </motion.div>

          {/* Background decorations */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[80px]" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100 dark:border-slate-800 text-center">
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">© 2026 Inclusion Marchand • Fait avec ❤️ pour Kouamé</p>
      </footer>
    </main>
  );
}
