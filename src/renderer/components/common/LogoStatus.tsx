import React, { useState, useEffect } from 'react';
import { checkLogoExists } from '../../utils/logoUtils';

const LogoStatus: React.FC = () => {
  const [logoExists, setLogoExists] = useState<boolean | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);

  useEffect(() => {
    const checkLogo = async () => {
      const path = await checkLogoExists();
      setLogoExists(!!path);
      setLogoPath(path);
    };

    checkLogo();
  }, []);

  if (logoExists === null) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-yellow-700 text-sm">Verificando logo personalizado...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${
      logoExists 
        ? 'bg-green-50 border-green-200' 
        : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {logoExists ? (
            <>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-green-800">Logo Personalizado Activo</h4>
                <p className="text-sm text-green-600">Tu logo PNG se está usando en toda la aplicación</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-blue-800">Logo por Defecto</h4>
                <p className="text-sm text-blue-600">Usando diseño circular amarillo. Agrega logo-farmacias-ms.png para personalizar</p>
              </div>
            </>
          )}
        </div>

        {logoExists && logoPath && (
          <div className="flex-shrink-0">
            <img 
              src={logoPath} 
              alt="Logo personalizado" 
              className="w-12 h-12 object-contain rounded border border-green-200"
            />
          </div>
        )}
      </div>

      {!logoExists && (
        <div className="mt-3 text-xs text-blue-600">
          📁 Ubicación: <code className="bg-blue-100 px-1 rounded">public/images/logo-farmacias-ms.png</code>
        </div>
      )}
    </div>
  );
};

export default LogoStatus;