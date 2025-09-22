/**
 * Utilidades para manejo del logo personalizado
 */

/**
 * Verifica si existe el logo PNG personalizado
 * @returns Promise<string | null> - Ruta del logo o null si no existe
 */
export const checkLogoExists = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const logoPath = '/images/logo-farmacias-ms.png';
    const img = new Image();
    
    img.onload = () => {
      console.log('✅ Logo personalizado detectado para impresión');
      resolve(logoPath);
    };
    
    img.onerror = () => {
      console.log('⚠️ Logo personalizado no encontrado, usando diseño por defecto');
      resolve(null);
    };
    
    img.src = logoPath;
  });
};

/**
 * Obtiene la configuración del logo para tickets
 * @returns Promise<object> - Configuración del logo para tickets
 */
export const getLogoConfigForTicket = async () => {
  const logoPath = await checkLogoExists();
  
  return {
    logoPath,
    hasLogo: !!logoPath,
    logoConfig: logoPath ? {
      maxWidth: '80px',
      maxHeight: '80px',
      style: 'max-width: 80px; max-height: 80px; object-fit: contain; margin: 0 auto;'
    } : null
  };
};

/**
 * Obtiene los datos base para cualquier ticket con logo incluido
 * @param ticketData - Datos base del ticket
 * @returns Promise<object> - Datos del ticket con logo
 */
export const prepareTicketData = async (ticketData: any) => {
  const logoPath = await checkLogoExists();
  
  return {
    ...ticketData,
    logoPath
  };
};