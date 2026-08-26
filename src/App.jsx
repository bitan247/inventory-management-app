import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Load items from localStorage with cost price
  const [items, setItems] = useState(() => {
    const savedItems = localStorage.getItem("inventory-items");
    if (savedItems) {
      return JSON.parse(savedItems);
    }
    // Default construction materials demo data with cost prices
    return [
      {
        id: 1,
        name: "Cement (50kg bag)",
        sku: "CEM-001",
        category: "Cement & Concrete",
        quantity: 45,
        costPrice: 380.0,
        sellingPrice: 450.0,
        unit: "bags",
        minStockLevel: 20,
        supplier: "Dangote Cement",
        location: "Warehouse A, Shelf 1",
      },
      {
        id: 2,
        name: "Steel Rebar (12mm)",
        sku: "STL-002",
        category: "Steel & Metal",
        quantity: 150,
        costPrice: 720.0,
        sellingPrice: 850.0,
        unit: "pieces",
        minStockLevel: 50,
        supplier: "African Steel Mills",
        location: "Warehouse B, Section 3",
      },
      {
        id: 3,
        name: "Sand (Sharp, per ton)",
        sku: "SND-003",
        category: "Aggregates",
        quantity: 12,
        costPrice: 2000.0,
        sellingPrice: 2500.0,
        unit: "tons",
        minStockLevel: 5,
        supplier: "Local Quarry Ltd",
        location: "Outdoor Storage",
      },
      {
        id: 4,
        name: "Electrical PVC Pipe (25mm)",
        sku: "ELE-004",
        category: "Electrical",
        quantity: 200,
        costPrice: 280.0,
        sellingPrice: 350.0,
        unit: "meters",
        minStockLevel: 100,
        supplier: "PowerTech Supplies",
        location: "Warehouse A, Shelf 4",
      },
      {
        id: 5,
        name: "Ceramic Floor Tiles (60x60cm)",
        sku: "TIL-005",
        category: "Finishing Materials",
        quantity: 30,
        costPrice: 2200.0,
        sellingPrice: 2800.0,
        unit: "boxes",
        minStockLevel: 15,
        supplier: "Royal Ceramics",
        location: "Warehouse C, Section 1",
      },
      {
        id: 6,
        name: "Copper Wire (2.5mm²)",
        sku: "ELE-006",
        category: "Electrical",
        quantity: 8,
        costPrice: 950.0,
        sellingPrice: 1200.0,
        unit: "rolls",
        minStockLevel: 10,
        supplier: "PowerTech Supplies",
        location: "Warehouse A, Shelf 3",
      },
      {
        id: 7,
        name: "Waterproof Membrane",
        sku: "WTR-007",
        category: "Waterproofing",
        quantity: 42,
        costPrice: 1200.0,
        sellingPrice: 1500.0,
        unit: "rolls",
        minStockLevel: 20,
        supplier: "SealPro Solutions",
        location: "Warehouse B, Shelf 2",
      },
      {
        id: 8,
        name: "Plywood (18mm, 4x8ft)",
        sku: "WD-008",
        category: "Timber & Wood",
        quantity: 65,
        costPrice: 2600.0,
        sellingPrice: 3200.0,
        unit: "sheets",
        minStockLevel: 25,
        supplier: "Timber World",
        location: "Warehouse C, Section 2",
      },
    ];
  });

  // Track purchases (stock in)
  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem("purchases");
    return saved ? JSON.parse(saved) : [];
  });

  // Track sales (stock out)
  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem("sales");
    return saved ? JSON.parse(saved) : [];
  });

  // Track customers
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem("customers");
    return saved ? JSON.parse(saved) : [];
  });

  const [nextId, setNextId] = useState(() => {
    const savedId = localStorage.getItem("inventory-next-id");
    return savedId ? JSON.parse(savedId) : 9;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Bulk import state
  const [bulkText, setBulkText] = useState("");
  const importFileRef = useRef(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    quantity: "",
    costPrice: "",
    sellingPrice: "",
    unit: "",
    minStockLevel: "",
    supplier: "",
    location: "",
  });

  const [editingItem, setEditingItem] = useState(null);

  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState({
    itemId: "",
    quantity: "",
    costPrice: "",
    supplier: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Sales form state
  const [saleForm, setSaleForm] = useState({
    items: [{ itemId: "", quantity: "", sellingPrice: "" }],
    customerName: "",
    date: new Date().toISOString().split("T")[0],
    discount: 0,
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("inventory-items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("purchases", JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem("sales", JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem("customers", JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem("inventory-next-id", JSON.stringify(nextId));
  }, [nextId]);

  // Add/Update item
  const addItem = (e) => {
    e.preventDefault();
    if (formData.name && formData.sku) {
      if (editingItem) {
        setItems(
          items.map((item) =>
            item.id === editingItem.id
              ? {
                  ...item,
                  ...formData,
                  quantity: parseInt(formData.quantity) || 0,
                  costPrice: parseFloat(formData.costPrice) || 0,
                  sellingPrice: parseFloat(formData.sellingPrice) || 0,
                  minStockLevel: parseInt(formData.minStockLevel) || 0,
                }
              : item,
          ),
        );
        setEditingItem(null);
      } else {
        setItems([
          ...items,
          {
            ...formData,
            id: nextId,
            quantity: parseInt(formData.quantity) || 0,
            costPrice: parseFloat(formData.costPrice) || 0,
            sellingPrice: parseFloat(formData.sellingPrice) || 0,
            minStockLevel: parseInt(formData.minStockLevel) || 0,
          },
        ]);
        setNextId(nextId + 1);
      }
      setFormData({
        name: "",
        sku: "",
        category: "",
        quantity: "",
        costPrice: "",
        sellingPrice: "",
        unit: "",
        minStockLevel: "",
        supplier: "",
        location: "",
      });
      setCurrentPage("inventory");
    }
  };

  // Record purchase (stock in)
  const recordPurchase = (e) => {
    e.preventDefault();
    const item = items.find((i) => i.id === parseInt(purchaseForm.itemId));
    if (!item) return;

    const purchase = {
      id: Date.now(),
      itemId: item.id,
      itemName: item.name,
      quantity: parseInt(purchaseForm.quantity),
      costPrice: parseFloat(purchaseForm.costPrice),
      totalCost:
        parseInt(purchaseForm.quantity) * parseFloat(purchaseForm.costPrice),
      supplier: purchaseForm.supplier || item.supplier,
      date: purchaseForm.date,
      timestamp: new Date().toISOString(),
    };

    setPurchases([...purchases, purchase]);

    // Update item quantity and cost price
    setItems(
      items.map((i) =>
        i.id === item.id
          ? {
              ...i,
              quantity: i.quantity + purchase.quantity,
              costPrice: purchase.costPrice,
            }
          : i,
      ),
    );

    setPurchaseForm({
      itemId: "",
      quantity: "",
      costPrice: "",
      supplier: "",
      date: new Date().toISOString().split("T")[0],
    });

    alert(
      "Added " +
        purchase.quantity +
        " " +
        item.unit +
        " of " +
        item.name +
        " to stock",
    );
  };

  // Record sale (stock out)
  const recordSale = (e) => {
    e.preventDefault();
    let totalSale = 0;
    let totalCost = 0;
    const saleItems = [];

    // Process each item in the sale
    for (const saleItem of saleForm.items) {
      const item = items.find((i) => i.id === parseInt(saleItem.itemId));
      if (!item || !saleItem.quantity) continue;

      if (parseInt(saleItem.quantity) > item.quantity) {
        alert(
          "Not enough stock for " +
            item.name +
            ". Available: " +
            item.quantity +
            " " +
            item.unit,
        );
        return;
      }

      const quantity = parseInt(saleItem.quantity);
      const sellingPrice =
        parseFloat(saleItem.sellingPrice) || item.sellingPrice;
      const costPrice = item.costPrice;

      saleItems.push({
        itemId: item.id,
        itemName: item.name,
        quantity,
        sellingPrice,
        costPrice,
        subtotal: quantity * sellingPrice,
      });

      totalSale += quantity * sellingPrice;
      totalCost += quantity * costPrice;
    }

    if (saleItems.length === 0) {
      alert("Please add at least one item to the sale");
      return;
    }

    // Apply discount if any
    const discountAmount = (totalSale * (saleForm.discount || 0)) / 100;
    const finalTotal = totalSale - discountAmount;

    const sale = {
      id: Date.now(),
      items: saleItems,
      customerName: saleForm.customerName || "Walk-in Customer",
      date: saleForm.date,
      discount: discountAmount,
      totalSale: finalTotal,
      totalCost,
      profit: finalTotal - totalCost,
      timestamp: new Date().toISOString(),
    };

    setSales([...sales, sale]);

    // Update stock quantities
    setItems(
      items.map((item) => {
        const soldItem = saleItems.find((si) => si.itemId === item.id);
        return soldItem
          ? {
              ...item,
              quantity: item.quantity - soldItem.quantity,
            }
          : item;
      }),
    );

    // Save customer if new
    if (saleForm.customerName && saleForm.customerName !== "Walk-in Customer") {
      const existingCustomer = customers.find(
        (c) => c.name.toLowerCase() === saleForm.customerName.toLowerCase(),
      );
      if (!existingCustomer) {
        setCustomers([
          ...customers,
          {
            id: Date.now(),
            name: saleForm.customerName,
            totalPurchases: finalTotal,
            lastPurchaseDate: saleForm.date,
          },
        ]);
      } else {
        setCustomers(
          customers.map((c) =>
            c.id === existingCustomer.id
              ? {
                  ...c,
                  totalPurchases: c.totalPurchases + finalTotal,
                  lastPurchaseDate: saleForm.date,
                }
              : c,
          ),
        );
      }
    }

    setSaleForm({
      items: [{ itemId: "", quantity: "", sellingPrice: "" }],
      customerName: "",
      date: new Date().toISOString().split("T")[0],
      discount: 0,
    });

    alert(
      "Sale recorded! Total: " +
        formatCurrency(finalTotal) +
        " | Profit: " +
        formatCurrency(finalTotal - totalCost),
    );
  };

  // Delete item
  const deleteItem = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  // Update quantity
  const updateQuantity = (id, change) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item,
      ),
    );
  };

  // Edit item
  const startEditing = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity.toString(),
      costPrice: item.costPrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      unit: item.unit,
      minStockLevel: item.minStockLevel.toString(),
      supplier: item.supplier,
      location: item.location,
    });
    setCurrentPage("add-item");
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate statistics
  const totalItems = items.length;
  const totalStockValue = items.reduce(
    (total, item) => total + item.costPrice * item.quantity,
    0,
  );
  const totalPotentialRevenue = items.reduce(
    (total, item) => total + item.sellingPrice * item.quantity,
    0,
  );
  const totalPotentialProfit = totalPotentialRevenue - totalStockValue;
  const lowStockItems = items.filter(
    (item) => item.quantity <= item.minStockLevel,
  );

  // Today's sales
  const today = new Date().toISOString().split("T")[0];
  const todaySales = sales.filter((sale) => sale.date === today);
  const todayRevenue = todaySales.reduce(
    (total, sale) => total + sale.totalSale,
    0,
  );
  const todayProfit = todaySales.reduce(
    (total, sale) => total + sale.profit,
    0,
  );

  // This month's sales
  const thisMonth = today.substring(0, 7);
  const monthSales = sales.filter((sale) => sale.date.startsWith(thisMonth));
  const monthRevenue = monthSales.reduce(
    (total, sale) => total + sale.totalSale,
    0,
  );
  const monthProfit = monthSales.reduce(
    (total, sale) => total + sale.profit,
    0,
  );

  // Get filtered and sorted items
  const categories = ["all", ...new Set(items.map((item) => item.category))];
  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      const matchesLowStock =
        !showLowStockOnly || item.quantity <= item.minStockLevel;
      return matchesSearch && matchesCategory && matchesLowStock;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "quantity":
          return a.quantity - b.quantity;
        case "profit":
          return a.sellingPrice - a.costPrice - (b.sellingPrice - b.costPrice);
        default:
          return 0;
      }
    });

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "SKU,Name,Category,Quantity,Unit,Cost Price,Selling Price,Profit/Unit,Stock Value,Potential Revenue,Supplier,Location,Min Stock",
    ];
    const rows = items.map((item) => {
      const profitPerUnit = item.sellingPrice - item.costPrice;
      return (
        item.sku +
        ',"' +
        item.name +
        '",' +
        item.category +
        "," +
        item.quantity +
        "," +
        item.unit +
        "," +
        item.costPrice +
        "," +
        item.sellingPrice +
        "," +
        profitPerUnit +
        "," +
        item.costPrice * item.quantity +
        "," +
        item.sellingPrice * item.quantity +
        ',"' +
        item.supplier +
        '","' +
        item.location +
        '",' +
        item.minStockLevel
      );
    });
    const csv = headers.concat(rows).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-export-" + today + ".csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export full backup as JSON
  const exportBackup = () => {
    const data = { items, purchases, sales, customers, nextId };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "buildmart-backup-" + new Date().toISOString().split("T")[0] + ".json";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle import backup file
  const importBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (
          data.items &&
          data.purchases &&
          data.sales &&
          data.customers &&
          data.nextId
        ) {
          setItems(data.items);
          setPurchases(data.purchases);
          setSales(data.sales);
          setCustomers(data.customers);
          setNextId(data.nextId);
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          alert("Invalid backup file.");
        }
      } catch (err) {
        alert("Error reading file. Please select a valid JSON backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Bulk import from CSV
  const handleBulkImport = () => {
    const lines = bulkText.trim().split("\n");
    if (lines.length < 2) {
      alert("Please paste CSV data with at least one data row.");
      return;
    }

    const newItems = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length < 10) continue;
      const item = {
        name: values[0].trim(),
        sku: values[1].trim(),
        category: values[2].trim(),
        quantity: parseInt(values[3]) || 0,
        unit: values[4].trim(),
        costPrice: parseFloat(values[5]) || 0,
        sellingPrice: parseFloat(values[6]) || 0,
        minStockLevel: parseInt(values[7]) || 0,
        supplier: values[8].trim(),
        location: values[9].trim(),
        id: nextId + newItems.length,
      };
      newItems.push(item);
    }

    if (newItems.length === 0) {
      alert("No valid rows found.");
      return;
    }

    setItems((prev) => [...prev, ...newItems]);
    setNextId(nextId + newItems.length);
    setBulkText("");
    alert("Added " + newItems.length + " items successfully!");
  };

  // Handle file upload for bulk import
  const handleBulkFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBulkText(event.target.result);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <div className="dashboard">
            <h1 className="page-title">📊 Dashboard</h1>

            <div className="financial-summary">
              <div className="financial-card">
                <h3>💰 Capital in Stock</h3>
                <p className="financial-number">
                  {formatCurrency(totalStockValue)}
                </p>
              </div>
              <div className="financial-card">
                <h3>📈 Potential Revenue</h3>
                <p className="financial-number">
                  {formatCurrency(totalPotentialRevenue)}
                </p>
              </div>
              <div className="financial-card profit">
                <h3>✅ Potential Profit</h3>
                <p className="financial-number">
                  {formatCurrency(totalPotentialProfit)}
                </p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <h3>📦 Total Items</h3>
                <p className="stat-number">{totalItems}</p>
              </div>
              <div
                className={
                  "stat-card " + (lowStockItems.length > 0 ? "warning" : "")
                }
              >
                <h3>⚠️ Low Stock</h3>
                <p className="stat-number">{lowStockItems.length}</p>
              </div>
              <div className="stat-card">
                <h3>📅 Today's Sales</h3>
                <p className="stat-number">{formatCurrency(todayRevenue)}</p>
              </div>
              <div className="stat-card profit">
                <h3>💵 Today's Profit</h3>
                <p className="stat-number">{formatCurrency(todayProfit)}</p>
              </div>
            </div>

            <div className="quick-actions">
              <button
                onClick={() => setCurrentPage("record-sale")}
                className="quick-action-btn sale"
              >
                💰 Record Sale
              </button>
              <button
                onClick={() => setCurrentPage("record-purchase")}
                className="quick-action-btn purchase"
              >
                📥 Record Purchase
              </button>
              <button
                onClick={() => setCurrentPage("reports")}
                className="quick-action-btn report"
              >
                📊 View Reports
              </button>
              <button
                onClick={() => setCurrentPage("bulk-import")}
                className="quick-action-btn import"
              >
                📥 Bulk Import
              </button>
            </div>

            <div className="backup-section">
              <button onClick={exportBackup} className="backup-btn">
                💾 Export Backup
              </button>
              <button
                onClick={() => importFileRef.current.click()}
                className="backup-btn"
              >
                📂 Import Backup
              </button>
              <input
                type="file"
                accept=".json"
                ref={importFileRef}
                style={{ display: "none" }}
                onChange={importBackup}
              />
              {importSuccess && (
                <p className="success-message">
                  ✅ Backup restored successfully!
                </p>
              )}
            </div>

            {lowStockItems.length > 0 && (
              <div className="alert-warning">
                <h3>⚠️ Low Stock Alert</h3>
                {lowStockItems.map((item) => (
                  <div key={item.id} className="alert-item">
                    {item.name} - Only {item.quantity} {item.unit} left
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "inventory":
        return (
          <div className="inventory-page">
            <h1 className="page-title">📦 Inventory</h1>

            <div className="filters">
              <input
                type="text"
                placeholder="🔍 Search..."
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
                    {cat === "all" ? "All" : cat}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Sort by Name</option>
                <option value="quantity">Sort by Quantity</option>
                <option value="profit">Sort by Profit</option>
              </select>
            </div>

            <div className="inventory-list">
              {filteredItems.map((item) => {
                const profitPerUnit = item.sellingPrice - item.costPrice;
                const isLow = item.quantity <= item.minStockLevel;
                return (
                  <div
                    key={item.id}
                    className={"inventory-card " + (isLow ? "low-stock" : "")}
                  >
                    <div className="inventory-card-header">
                      <h3>{item.name}</h3>
                      <span className="category-badge">{item.category}</span>
                    </div>
                    <div className="inventory-card-details">
                      <p>SKU: {item.sku}</p>
                      <p>
                        Stock:{" "}
                        <strong>
                          {item.quantity} {item.unit}
                        </strong>
                      </p>
                      <p>Cost: {formatCurrency(item.costPrice)}</p>
                      <p>Sell: {formatCurrency(item.sellingPrice)}</p>
                      <p className="profit-text">
                        Profit: {formatCurrency(profitPerUnit)}/unit
                      </p>
                    </div>
                    <div className="inventory-card-actions">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="qty-btn"
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
                      <button
                        onClick={() => startEditing(item)}
                        className="edit-btn"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="delete-btn"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "record-purchase":
        return (
          <div className="form-page">
            <h1 className="page-title">📥 Record Purchase</h1>
            <form onSubmit={recordPurchase} className="simple-form">
              <div className="form-group">
                <label>Select Item *</label>
                <select
                  value={purchaseForm.itemId}
                  onChange={(e) => {
                    const item = items.find(
                      (i) => i.id === parseInt(e.target.value),
                    );
                    setPurchaseForm({
                      ...purchaseForm,
                      itemId: e.target.value,
                      costPrice: item ? item.costPrice : "",
                      supplier: item ? item.supplier : "",
                    });
                  }}
                  required
                >
                  <option value="">Select item...</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Current: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  value={purchaseForm.quantity}
                  onChange={(e) =>
                    setPurchaseForm({
                      ...purchaseForm,
                      quantity: e.target.value,
                    })
                  }
                  required
                  min="1"
                  placeholder="Enter quantity"
                />
              </div>
              <div className="form-group">
                <label>Cost Price per Unit *</label>
                <input
                  type="number"
                  value={purchaseForm.costPrice}
                  onChange={(e) =>
                    setPurchaseForm({
                      ...purchaseForm,
                      costPrice: e.target.value,
                    })
                  }
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Supplier</label>
                <input
                  type="text"
                  value={purchaseForm.supplier}
                  onChange={(e) =>
                    setPurchaseForm({
                      ...purchaseForm,
                      supplier: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={purchaseForm.date}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, date: e.target.value })
                  }
                  required
                />
              </div>
              <button type="submit" className="submit-btn">
                ✅ Record Purchase
              </button>
            </form>
          </div>
        );

      case "record-sale":
        return (
          <div className="form-page">
            <h1 className="page-title">💰 Record Sale</h1>
            <form onSubmit={recordSale} className="simple-form">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={saleForm.customerName}
                  onChange={(e) =>
                    setSaleForm({ ...saleForm, customerName: e.target.value })
                  }
                  placeholder="Walk-in Customer"
                  list="customer-list"
                />
                <datalist id="customer-list">
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.name} />
                  ))}
                </datalist>
              </div>

              {saleForm.items.map((saleItem, index) => (
                <div key={index} className="sale-item-row">
                  <div className="form-group">
                    <label>Item {index + 1} *</label>
                    <select
                      value={saleItem.itemId}
                      onChange={(e) => {
                        const item = items.find(
                          (i) => i.id === parseInt(e.target.value),
                        );
                        const newItems = [...saleForm.items];
                        newItems[index] = {
                          ...newItems[index],
                          itemId: e.target.value,
                          sellingPrice: item ? item.sellingPrice : "",
                        };
                        setSaleForm({ ...saleForm, items: newItems });
                      }}
                      required
                    >
                      <option value="">Select item...</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Stock: {item.quantity} | Price:{" "}
                          {formatCurrency(item.sellingPrice)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Quantity *</label>
                      <input
                        type="number"
                        value={saleItem.quantity}
                        onChange={(e) => {
                          const newItems = [...saleForm.items];
                          newItems[index] = {
                            ...newItems[index],
                            quantity: e.target.value,
                          };
                          setSaleForm({ ...saleForm, items: newItems });
                        }}
                        required
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Selling Price</label>
                      <input
                        type="number"
                        value={saleItem.sellingPrice}
                        onChange={(e) => {
                          const newItems = [...saleForm.items];
                          newItems[index] = {
                            ...newItems[index],
                            sellingPrice: e.target.value,
                          };
                          setSaleForm({ ...saleForm, items: newItems });
                        }}
                        step="0.01"
                      />
                    </div>
                  </div>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = saleForm.items.filter(
                          (_, i) => i !== index,
                        );
                        setSaleForm({ ...saleForm, items: newItems });
                      }}
                      className="remove-btn"
                    >
                      ❌ Remove
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setSaleForm({
                    ...saleForm,
                    items: [
                      ...saleForm.items,
                      { itemId: "", quantity: "", sellingPrice: "" },
                    ],
                  })
                }
                className="add-more-btn"
              >
                ➕ Add Another Item
              </button>

              <div className="form-group">
                <label>Discount (%)</label>
                <input
                  type="number"
                  value={saleForm.discount}
                  onChange={(e) =>
                    setSaleForm({ ...saleForm, discount: e.target.value })
                  }
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={saleForm.date}
                  onChange={(e) =>
                    setSaleForm({ ...saleForm, date: e.target.value })
                  }
                  required
                />
              </div>

              <button type="submit" className="submit-btn sale-btn">
                💰 Complete Sale
              </button>
            </form>
          </div>
        );

      case "reports":
        return (
          <div className="reports-page">
            <h1 className="page-title">📊 Reports</h1>

            <div className="report-summary">
              <div className="report-card">
                <h3>Today's Summary</h3>
                <p>
                  Sales: <strong>{formatCurrency(todayRevenue)}</strong>
                </p>
                <p>
                  Profit: <strong>{formatCurrency(todayProfit)}</strong>
                </p>
                <p>Transactions: {todaySales.length}</p>
              </div>

              <div className="report-card">
                <h3>This Month</h3>
                <p>
                  Sales: <strong>{formatCurrency(monthRevenue)}</strong>
                </p>
                <p>
                  Profit: <strong>{formatCurrency(monthProfit)}</strong>
                </p>
                <p>Transactions: {monthSales.length}</p>
              </div>

              <div className="report-card">
                <h3>Inventory Value</h3>
                <p>
                  Capital: <strong>{formatCurrency(totalStockValue)}</strong>
                </p>
                <p>
                  Potential Revenue:{" "}
                  <strong>{formatCurrency(totalPotentialRevenue)}</strong>
                </p>
                <p>
                  Potential Profit:{" "}
                  <strong>{formatCurrency(totalPotentialProfit)}</strong>
                </p>
              </div>
            </div>

            <div className="recent-sales">
              <h2>Recent Sales</h2>
              {sales
                .slice()
                .reverse()
                .slice(0, 10)
                .map((sale) => (
                  <div key={sale.id} className="sale-record">
                    <div className="sale-record-header">
                      <span>{sale.date}</span>
                      <span>{sale.customerName}</span>
                      <span className="sale-total">
                        {formatCurrency(sale.totalSale)}
                      </span>
                    </div>
                    <div className="sale-record-items">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="sale-item">
                          {item.itemName} x {item.quantity} ={" "}
                          {formatCurrency(item.subtotal)}
                        </div>
                      ))}
                    </div>
                    <div className="sale-record-profit">
                      Profit: {formatCurrency(sale.profit)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );

      case "add-item":
        return (
          <div className="form-page">
            <h1 className="page-title">
              {editingItem ? "✏️ Edit Item" : "➕ Add Item"}
            </h1>
            <form onSubmit={addItem} className="simple-form">
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Cement & Concrete">Cement & Concrete</option>
                  <option value="Steel & Metal">Steel & Metal</option>
                  <option value="Aggregates">Aggregates</option>
                  <option value="Timber & Wood">Timber & Wood</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Finishing Materials">
                    Finishing Materials
                  </option>
                  <option value="Waterproofing">Waterproofing</option>
                  <option value="Paint & Coatings">Paint & Coatings</option>
                  <option value="Hardware & Tools">Hardware & Tools</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Cost Price *</label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: e.target.value })
                    }
                    required
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Selling Price *</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellingPrice: e.target.value })
                    }
                    required
                    step="0.01"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Unit</option>
                    <option value="bags">Bags</option>
                    <option value="pieces">Pieces</option>
                    <option value="tons">Tons</option>
                    <option value="kg">Kilograms</option>
                    <option value="meters">Meters</option>
                    <option value="rolls">Rolls</option>
                    <option value="sheets">Sheets</option>
                    <option value="boxes">Boxes</option>
                    <option value="liters">Liters</option>
                    <option value="packs">Packs</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Minimum Stock Level</label>
                <input
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, minStockLevel: e.target.value })
                  }
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <button type="submit" className="submit-btn">
                {editingItem ? "💾 Update Item" : "➕ Add Item"}
              </button>
            </form>
          </div>
        );

      case "bulk-import":
        return (
          <div className="form-page">
            <h1 className="page-title">📥 Bulk Import Items</h1>
            <div className="simple-form">
              <p>Paste CSV data with columns:</p>
              <code>
                Name,SKU,Category,Quantity,Unit,CostPrice,SellingPrice,MinStockLevel,Supplier,Location
              </code>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows="6"
                placeholder="Name,SKU,Category,Quantity,Unit,CostPrice,SellingPrice,MinStockLevel,Supplier,Location&#10;Cement,CEM-001,Cement & Concrete,50,bags,380,450,20,Dangote,Warehouse A"
                className="bulk-textarea"
              />
              <input type="file" accept=".csv,.txt" onChange={handleBulkFile} />
              <button onClick={handleBulkImport} className="submit-btn">
                ✅ Import Items
              </button>
            </div>
          </div>
        );

      default:
        return <h1>Page Not Found</h1>;
    }
  };

  return (
    <div className="app">
      <nav className="bottom-nav">
        <button
          onClick={() => setCurrentPage("dashboard")}
          className={"nav-btn " + (currentPage === "dashboard" ? "active" : "")}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Home</span>
        </button>
        <button
          onClick={() => setCurrentPage("record-sale")}
          className={
            "nav-btn " + (currentPage === "record-sale" ? "active" : "")
          }
        >
          <span className="nav-icon">💰</span>
          <span className="nav-label">Sale</span>
        </button>
        <button
          onClick={() => setCurrentPage("record-purchase")}
          className={
            "nav-btn " + (currentPage === "record-purchase" ? "active" : "")
          }
        >
          <span className="nav-icon">📥</span>
          <span className="nav-label">Purchase</span>
        </button>
        <button
          onClick={() => setCurrentPage("inventory")}
          className={"nav-btn " + (currentPage === "inventory" ? "active" : "")}
        >
          <span className="nav-icon">📦</span>
          <span className="nav-label">Stock</span>
        </button>
        <button
          onClick={() => setCurrentPage("reports")}
          className={"nav-btn " + (currentPage === "reports" ? "active" : "")}
        >
          <span className="nav-icon">📈</span>
          <span className="nav-label">Reports</span>
        </button>
      </nav>

      <main className="main-content">{renderPage()}</main>
    </div>
  );
}

export default App;
