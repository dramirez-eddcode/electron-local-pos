import React, { useState, useEffect } from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'circle' | 'horizontal' | 'vertical';
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  variant = 'circle',
  className = '',
  showText = true 
}) => {
  const [logoExists, setLogoExists] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

  // Configuración de tamaños
  const sizeConfig = {
    small: { width: 'w-12 h-12', text: 'text-xs' },
    medium: { width: 'w-16 h-16', text: 'text-sm' },
    large: { width: 'w-32 h-32', text: 'text-2xl' }
  };

  useEffect(() => {
    const checkLogo = async () => {
      try {
        // Intentar cargar el logo principal desde la carpeta public
        const logoPath = '/images/logo-farmacias-ms.png';
        
        // Crear una imagen para verificar si existe
        const img = new Image();
        img.onload = () => {
          console.log('✅ Logo PNG detectado:', logoPath);
          setLogoExists(true);
          setLogoUrl(logoPath);
        };
        img.onerror = () => {
          console.log('⚠️ Logo PNG no encontrado, usando diseño por defecto');
          setLogoExists(false);
        };
        img.src = logoPath;
      } catch (error) {
        console.error('Error detectando logo:', error);
        setLogoExists(false);
      }
    };

    checkLogo();
  }, []);

  // Si existe el logo PNG, usarlo
  if (logoExists && logoUrl) {
    if (variant === 'horizontal') {
      return (
        <div className={`flex items-center space-x-3 ${className}`}>
          <img 
            src={logoUrl} 
            alt="Farmacias MS Logo" 
            className={`${sizeConfig[size].width} object-contain`}
          />
          {showText && (
            <div className={`${sizeConfig[size].text} font-bold`}>
              <span className="text-red-600">FARMACIAS</span>
              <span className="text-blue-600 ml-1">MS</span>
            </div>
          )}
        </div>
      );
    }

    if (variant === 'vertical') {
      return (
        <div className={`flex flex-col items-center space-y-2 ${className}`}>
          <img 
            src={logoUrl} 
            alt="Farmacias MS Logo" 
            className={`${sizeConfig[size].width} object-contain`}
          />
          {showText && (
            <div className={`${sizeConfig[size].text} font-bold text-center`}>
              <div className="text-red-600">FARMACIAS</div>
              <div className="text-blue-600">MS</div>
            </div>
          )}
        </div>
      );
    }

    // Variant circle - solo la imagen
    return (
      <div className={`${className}`}>
        <img 
          src={logoUrl} 
          alt="Farmacias MS Logo" 
          className={`${sizeConfig[size].width} object-contain rounded-full`}
        />
      </div>
    );
  }

  // Fallback: Logo diseñado con CSS (actual)
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className={`bg-yellow-300 rounded-full ${sizeConfig[size].width} flex items-center justify-center shadow-md`}>
          <div className="text-center">
            <h1 className={`${size === 'small' ? 'text-xs' : size === 'large' ? 'text-lg' : 'text-sm'} font-bold text-red-600 leading-tight`}>
              FARMACIAS
            </h1>
            <h2 className={`${size === 'small' ? 'text-sm' : size === 'large' ? 'text-2xl' : 'text-lg'} font-bold text-blue-600 leading-tight`}>
              MS
            </h2>
          </div>
        </div>
        {showText && (
          <div className={`${sizeConfig[size].text} font-bold`}>
            <span className="text-red-600">FARMACIAS</span>
            <span className="text-blue-600 ml-1">MS</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center space-y-2 ${className}`}>
        <div className={`bg-yellow-300 rounded-full ${sizeConfig[size].width} flex items-center justify-center shadow-md`}>
          <div className="text-center">
            <h1 className={`${size === 'small' ? 'text-xs' : size === 'large' ? 'text-lg' : 'text-sm'} font-bold text-red-600 leading-tight`}>
              FARMACIAS
            </h1>
            <h2 className={`${size === 'small' ? 'text-sm' : size === 'large' ? 'text-2xl' : 'text-lg'} font-bold text-blue-600 leading-tight`}>
              MS
            </h2>
          </div>
        </div>
        {showText && (
          <div className={`${sizeConfig[size].text} font-bold text-center`}>
            <div className="text-red-600">FARMACIAS</div>
            <div className="text-blue-600">MS</div>
          </div>
        )}
      </div>
    );
  }

  // Variant circle - solo el círculo
  return (
    <div className={`bg-yellow-300 rounded-full ${sizeConfig[size].width} flex items-center justify-center shadow-md ${className}`}>
      <div className="text-center">
        <h1 className={`${size === 'small' ? 'text-xs' : size === 'large' ? 'text-lg' : 'text-sm'} font-bold text-red-600 leading-tight`}>
          FARMACIAS
        </h1>
        <h2 className={`${size === 'small' ? 'text-sm' : size === 'large' ? 'text-2xl' : 'text-lg'} font-bold text-blue-600 leading-tight`}>
          MS
        </h2>
      </div>
    </div>
  );
};

export default Logo;