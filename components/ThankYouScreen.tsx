import React from 'react';

const ThankYouScreen: React.FC = () => {
  return (
    <div className="text-center text-white bg-slate-800 p-10 rounded-xl shadow-lg transform transition-all animate-fade-in-scale">
      <h2 className="text-5xl font-black text-yellow-400 mb-4">Gracias por Votar</h2>
      <p className="text-lg text-gray-300">
        Cruza los dedos para que gane tu elegido y obtené beneficios exclusivos.
      </p>
      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ThankYouScreen;
