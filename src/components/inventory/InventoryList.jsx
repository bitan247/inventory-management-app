// src/components/inventory/InventoryList.jsx
import { useContext, useState } from "react";
import { InventoryContext } from "../../contexts/InventoryContext";
import Table from "../common/Table";

const InventoryList = () => {
  const { items, deleteItem } = useContext(InventoryContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const columns = [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Name" },
    {
      key: "quantity",
      label: "Quantity",
      render: (item) => (
        <span
          className={`quantity ${item.quantity <= item.minStockLevel ? "text-red" : "text-green"}`}
        >
          {item.quantity}
        </span>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (item) => `$${item.price.toFixed(2)}`,
    },
    { key: "category", label: "Category" },
  ];

  const actions = (item) => (
    <div className="action-buttons">
      <button onClick={() => navigate(`/inventory/${item.id}`)}>View</button>
      <button onClick={() => navigate(`/inventory/${item.id}/edit`)}>
        Edit
      </button>
      <button onClick={() => deleteItem(item.id)} className="danger">
        Delete
      </button>
    </div>
  );

  return (
    <div className="inventory-list">
      <div className="filters">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {/* Map through categories */}
        </select>
      </div>
      <Table
        columns={columns}
        data={filteredItems}
        actions={actions}
        onRowClick={(item) => navigate(`/inventory/${item.id}`)}
      />
    </div>
  );
};
