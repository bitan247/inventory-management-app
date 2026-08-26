import { useState } from "react";
import { useInventory } from "../contexts/InventoryContext";

function InventoryPage() {
  const { items, updateQuantity, deleteItem } = useInventory();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Get unique categories
  const categories = ["all", ...new Set(items.map((item) => item.category))];

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="inventory-page">
      <h1>Inventory</h1>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="category-select"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat}
            </option>
          ))}
        </select>
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => (
            <tr
              key={item.id}
              className={
                item.quantity <= item.minStockLevel ? "low-stock-row" : ""
              }
            >
              <td>{item.sku}</td>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="qty-btn"
                  disabled={item.quantity <= 0}
                >
                  -
                </button>
                <span className="quantity">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="qty-btn"
                >
                  +
                </button>
              </td>
              <td>${item.price.toFixed(2)}</td>
              <td>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryPage;
