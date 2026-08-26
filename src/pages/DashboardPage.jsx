import { useInventory } from "../contexts/InventoryContext";

function DashboardPage() {
  const { items, getLowStockItems, getTotalValue } = useInventory();
  const lowStockItems = getLowStockItems();
  const totalValue = getTotalValue();

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Items</h3>
          <p className="stat-number">{items.length}</p>
        </div>

        <div className="stat-card">
          <h3>Total Value</h3>
          <p className="stat-number">${totalValue.toFixed(2)}</p>
        </div>

        <div className="stat-card warning">
          <h3>Low Stock Items</h3>
          <p className="stat-number">{lowStockItems.length}</p>
        </div>

        <div className="stat-card">
          <h3>Categories</h3>
          <p className="stat-number">
            {new Set(items.map((i) => i.category)).size}
          </p>
        </div>
      </div>

      <div className="low-stock-section">
        <h2>⚠️ Low Stock Alerts</h2>
        {lowStockItems.length === 0 ? (
          <p className="success-message">All items are well stocked! ✅</p>
        ) : (
          <ul className="low-stock-list">
            {lowStockItems.map((item) => (
              <li key={item.id} className="low-stock-item">
                <strong>{item.name}</strong> - Current: {item.quantity} / Min:{" "}
                {item.minStockLevel}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
