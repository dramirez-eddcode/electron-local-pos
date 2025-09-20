import { useState, useEffect } from 'react'

function App() {
  const [count, setCount] = useState(0)
  const [printing, setPrinting] = useState(false)
  const [printResult, setPrintResult] = useState(null)
  const [openingDrawer, setOpeningDrawer] = useState(false)
  const [drawerResult, setDrawerResult] = useState(null)

  useEffect(() => {
    console.log('App loaded, checking electronAPI:', !!window.electronAPI)
    console.log('Window object keys:', Object.keys(window))
  }, [])

  const handlePrintTest = async () => {
    setPrinting(true)
    setPrintResult(null)
    
    // Verificar si la API de Electron está disponible
    if (!window.electronAPI) {
      setPrintResult({ 
        success: false, 
        error: "API de Electron no disponible. Asegúrate de que la aplicación esté ejecutándose en Electron." 
      })
      setPrinting(false)
      return
    }
    
    const testTicket = {
      storeName: "ELECTRON LOCAL POS",
      storeAddress: "Calle Principal #123, Ciudad",
      items: [
        { name: "Producto de prueba 1", quantity: 2, price: 15.50 },
        { name: "Producto de prueba 2", quantity: 1, price: 25.00 },
        { name: "Producto de prueba 3", quantity: 3, price: 8.75 }
      ],
      total: 57.25
    }
    
    try {
      const result = await window.electronAPI.printTicket(testTicket)
      setPrintResult(result)
    } catch (error) {
      console.error('Error de impresión:', error)
      setPrintResult({ success: false, error: error.message })
    } finally {
      setPrinting(false)
    }
  }

  const handleOpenCashDrawer = async () => {
    setOpeningDrawer(true)
    setDrawerResult(null)
    
    // Verificar si la API de Electron está disponible
    if (!window.electronAPI) {
      setDrawerResult({ 
        success: false, 
        error: "API de Electron no disponible. Asegúrate de que la aplicación esté ejecutándose en Electron." 
      })
      setOpeningDrawer(false)
      return
    }
    
    try {
      const result = await window.electronAPI.openCashDrawer()
      setDrawerResult(result)
    } catch (error) {
      console.error('Error al abrir cajón:', error)
      setDrawerResult({ success: false, error: error.message })
    } finally {
      setOpeningDrawer(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Electron Local POS
        </h1>
        
        <div className="text-center space-y-6">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-primary-900 mb-4">
              Sistema POS Local
            </h2>
            <p className="text-primary-600">
              Aplicación de punto de venta construida con Electron, React y Tailwind CSS v4
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <button 
              onClick={() => setCount(count - 1)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              -
            </button>
            
            <span className="text-2xl font-bold text-gray-800 min-w-12 text-center">
              {count}
            </span>
            
            <button 
              onClick={() => setCount(count + 1)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              +
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">React ✓</h3>
              <p className="text-sm text-blue-600">Frontend Framework</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Electron ✓</h3>
              <p className="text-sm text-purple-600">Desktop App</p>
            </div>
            <div className="bg-cyan-50 p-4 rounded-lg">
              <h3 className="font-semibold text-cyan-900">Tailwind v4 ✓</h3>
              <p className="text-sm text-cyan-600">Styling Framework</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Vite ✓</h3>
              <p className="text-sm text-green-600">Build Tool</p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-semibold text-orange-900 mb-4">🖨️ Pruebas de Impresión</h3>
            
            {/* Botón Imprimir Ticket */}
            <button
              onClick={handlePrintTest}
              disabled={printing}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition-all mb-3 ${
                printing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {printing ? 'Imprimiendo...' : 'Imprimir Ticket de Prueba'}
            </button>
            
            {printResult && (
              <div className={`mb-3 p-3 rounded-lg text-sm ${
                printResult.success 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {printResult.success 
                  ? `✅ ${printResult.message}` 
                  : `❌ Error: ${printResult.error}`
                }
              </div>
            )}

            {/* Botón Abrir Cajón */}
            <button
              onClick={handleOpenCashDrawer}
              disabled={openingDrawer}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
                openingDrawer 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {openingDrawer ? 'Abriendo cajón...' : '💰 Abrir Cajón de Dinero'}
            </button>
            
            {drawerResult && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                drawerResult.success 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {drawerResult.success 
                  ? `✅ ${drawerResult.message}` 
                  : `❌ Error: ${drawerResult.error}`
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App