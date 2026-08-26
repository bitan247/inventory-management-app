import { createContext, useState, useContext } from "react";

export const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  // Some initial demo data
  const [items, setItems] = useState([
    {
      id: 1,
      name: "Laptop",
      sku: "TECH-001",
      category: "Electronics",
      quantity: 5,
      price: 999.99,
      minStockLevel: 3,
      supplier: "TechSupply Co",
    },
    {
      id: 2,
      name: "Desk Chair",
      sku: "FURN-002",
      category: "Furniture",
      quantity: 2,
      price: 199.99,
      minStockLevel: 5,
      supplier: "OfficeMax",
    },
    {
      id: 3,
      name: "USB Cable",
      sku: "TECH-003",
      category: "Electronics",
      quantity: 50,
      price: 12.99,
      minStockLevel: 20,
      supplier: "TechSupply Co",
    },
  ]);

  const [nextId, setNextId] = useState(4);

  // Add new item
  const addItem = (itemData) => {
    const newItem = {
      ...itemData,
      id: nextId,
      quantity: parseInt(itemData.quantity) || 0,
      price: parseFloat(itemData.price) || 0,
      createdAt: new Date().toISOString(),
    };
    setItems([...items, newItem]);
    setNextId(nextId + 1);
  };

  // Update item quantity
  const updateQuantity = (id, change) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + change } : item,
      ),
    );
  };

  // Delete item
  const deleteItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Get low stock items
  const getLowStockItems = () => {
    return items.filter((item) => item.quantity <= item.minStockLevel);
  };

  // Calculate total inventory value
  const getTotalValue = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const value = {
    items,
    addItem,
    updateQuantity,
    deleteItem,
    getLowStockItems,
    getTotalValue,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

// Custom hook for using inventory
export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return context;
};
