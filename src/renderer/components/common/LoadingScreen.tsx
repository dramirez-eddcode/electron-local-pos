import React from 'react';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Cargando...", 
  showLogo = true 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        {showLogo && (
          <div className="bg-yellow-300 rounded-full w-32 h-32 mx-auto flex items-center justify-center shadow-lg mb-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 leading-tight">FARMACIAS</h1>
              <h2 className="text-3xl font-bold text-blue-600 leading-tight">MS</h2>
              <p className="text-xs text-gray-700 mt-1">GRUPO</p>
              <p className="text-xs text-gray-700">SIMILARES Y GENÉRICOS</p>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-gray-700">{message}</span>
        </div>
        
        <p className="text-sm text-gray-500">
          Sistema POS • Farmacias MS
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;