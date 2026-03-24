import { useAppStore } from './store';
import { LoginForm } from './features/auth/components/LoginForm';
import { Header } from './components/layout/Header';
import { useProducts } from './features/products/hooks/useProducts';
import { useOrders } from './features/orders/hooks/useOrders';
import { useInventory } from './features/inventory/hooks/useInventory';
import { useWebSockets } from './features/observability/hooks/useWebSockets';

import { CreateProductForm } from './features/products/components/CreateProductForm';
import { ProductList } from './features/products/components/ProductList';
import { InventoryList } from './features/inventory/components/InventoryList';
import { LiveEventStream } from './features/observability/components/LiveEventStream';

function App() {
  const { logs, token, logout } = useAppStore();
  const { isConnected } = useWebSockets();
  
  const { productsQuery, createProductMutation, updatePriceMutation, activateProductMutation, deactivateProductMutation } = useProducts();
  const { inventoryQuery } = useInventory();
  const { createOrderMutation } = useOrders();

  const handleBuy = (productId: number) => createOrderMutation.mutate({ productId, quantity: 1 });
  const handleUpdatePrice = (productId: number, currentPrice: number) => updatePriceMutation.mutate({ productId, newPrice: (currentPrice || 0) + 10 });
  const handleActivate = (productId: number) => activateProductMutation.mutate(productId);
  const handleDeactivate = (productId: number) => deactivateProductMutation.mutate(productId);

  const handleCreateProduct = (title: string, price: number) => {
    createProductMutation.mutate({
      title,
      price,
      description: 'Producto creado desde consola rápida',
      isActive: true,
      currency: 'USD',
      code: `PROD-${Math.random().toString(36).substring(7).toUpperCase()}`,
      about: []
    });
  };

  if (!token) {
    return <LoginForm />;
  }

  const isMutatingProduct = deactivateProductMutation.isPending || 
                            activateProductMutation.isPending || 
                            updatePriceMutation.isPending || 
                            createOrderMutation.isPending;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <Header isConnected={isConnected} onLogout={logout} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* LADO A: ACCIONES (Formulario y Compras) */}
          <div className="space-y-6 flex flex-col">
            <CreateProductForm 
              onSubmit={handleCreateProduct} 
              isPending={createProductMutation.isPending} 
            />
            
            <ProductList 
              products={productsQuery.data || []}
              isLoading={productsQuery.isLoading}
              onActivate={handleActivate}
              onDeactivate={handleDeactivate}
              onUpdatePrice={handleUpdatePrice}
              onBuy={handleBuy}
              isMutating={isMutatingProduct}
            />
          </div>

          {/* LADO B: OBSERVABILIDAD (Live Stream + Stock) */}
          <div className="space-y-6 flex flex-col">
            <InventoryList 
              inventory={inventoryQuery.data || []}
              isLoading={inventoryQuery.isLoading}
            />
            
            <LiveEventStream logs={logs} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
