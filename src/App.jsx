import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Load items from localStorage
  const [items, setItems] = useState(() => {
    const savedItems = localStorage.getItem("inventory-items");
    if (savedItems) {
      return JSON.parse(savedItems);
    }
    // Default demo data
    return [
      {
        id: 1,
        name: "Cement (50kg bag)",
        quantity: 45,
        costPrice: 380,
        sellingPrice: 450,
      },
      {
        id: 2,
        name: "Steel Rebar (12mm)",
        quantity: 150,
        costPrice: 720,
        sellingPrice: 850,
      },
      {
        id: 3,
        name: "Sharp Sand",
        quantity: 12,
        costPrice: 2000,
        sellingPrice: 2500,
      },
      {
        id: 4,
        name: "PVC Pipe (25mm)",
        quantity: 200,
        costPrice: 280,
        sellingPrice: 350,
      },
      {
        id: 5,
        name: "Ceramic Floor Tiles",
        quantity: 30,
        costPrice: 2200,
        sellingPrice: 2800,
      },
      {
        id: 6,
        name: "Copper Wire (2.5mm)",
        quantity: 8,
        costPrice: 950,
        sellingPrice: 1200,
      },
      {
        id: 7,
        name: "Waterproof Membrane",
        quantity: 42,
        costPrice: 1200,
        sellingPrice: 1500,
      },
      {
        id: 8,
        name: "Plywood (18mm)",
        quantity: 65,
        costPrice: 2600,
        sellingPrice: 3200,
      },
    ];
  });

  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem("purchases");
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem("sales");
    return saved ? JSON.parse(saved) : [];
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem("customers");
    return saved ? JSON.parse(saved) : [];
  });

  const [nextId, setNextId] = useState(() => {
    const savedId = localStorage.getItem("inventory-next-id");
    return savedId ? JSON.parse(savedId) : 9;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");

  // Bulk import state
  const [bulkText, setBulkText] = useState("");
  const importFileRef = useRef(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    costPrice: "",
    sellingPrice: "",
  });

  const [editingItem, setEditingItem] = useState(null);

  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState({
    itemId: "",
    quantity: "",
    costPrice: "",
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
    if (!formData.name) return;

    const now = new Date().toISOString();

    if (editingItem) {
      setItems(
        items.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                name: formData.name,
                quantity: parseInt(formData.quantity) || 0,
                costPrice: parseFloat(formData.costPrice) || 0,
                sellingPrice: parseFloat(formData.sellingPrice) || 0,
                updatedAt: now,
              }
            : item,
        ),
      );
      setEditingItem(null);
    } else {
      setItems([
        ...items,
        {
          id: nextId,
          name: formData.name,
          quantity: parseInt(formData.quantity) || 0,
          costPrice: parseFloat(formData.costPrice) || 0,
          sellingPrice: parseFloat(formData.sellingPrice) || 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);
      setNextId(nextId + 1);
    }

    setFormData({ name: "", quantity: "", costPrice: "", sellingPrice: "" });
    setCurrentPage("inventory");
  };

  // Record purchase
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
      date: purchaseForm.date,
      timestamp: new Date().toISOString(),
    };

    setPurchases([...purchases, purchase]);
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
      date: new Date().toISOString().split("T")[0],
    });

    alert("Added " + purchase.quantity + " of " + item.name + " to stock");
  };

  // Record sale
  const recordSale = (e) => {
    e.preventDefault();
    let totalSale = 0;
    let totalCost = 0;
    const saleItems = [];

    for (const saleItem of saleForm.items) {
      const item = items.find((i) => i.id === parseInt(saleItem.itemId));
      if (!item || !saleItem.quantity) continue;

      if (parseInt(saleItem.quantity) > item.quantity) {
        alert(
          "Not enough stock for " + item.name + ". Available: " + item.quantity,
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

    setItems(
      items.map((item) => {
        const soldItem = saleItems.find((si) => si.itemId === item.id);
        return soldItem
          ? { ...item, quantity: item.quantity - soldItem.quantity }
          : item;
      }),
    );

    if (saleForm.customerName && saleForm.customerName !== "Walk-in Customer") {
      const existing = customers.find(
        (c) => c.name.toLowerCase() === saleForm.customerName.toLowerCase(),
      );
      if (!existing) {
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
            c.id === existing.id
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

  const deleteItem = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateQuantity = (id, change) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item,
      ),
    );
  };

  const startEditing = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      costPrice: item.costPrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
    });
    setCurrentPage("add-item");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Stats
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

  // Filtered items
    const filteredItems = items
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'quantity') return a.quantity - b.quantity;
      if (sortBy === 'profit') return (a.sellingPrice - a.costPrice) - (b.sellingPrice - b.costPrice);
      if (sortBy === 'date') {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      }
      return 0;
    });

  // Export CSV
  const exportToCSV = () => {
    const headers = "Name,Quantity,CostPrice,SellingPrice";
    const rows = items.map(
      (item) =>
        '"' +
        item.name +
        '",' +
        item.quantity +
        "," +
        item.costPrice +
        "," +
        item.sellingPrice,
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-" + today + ".csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export backup
  const exportBackup = () => {
    const data = { items, purchases, sales, customers, nextId };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buildmart-backup-" + today + ".json";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Import backup
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
        alert("Error reading file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Bulk import (4 columns only)
  const handleBulkImport = () => {
    const lines = bulkText.trim().split("\n");
    if (lines.length < 2) {
      alert("Please paste CSV data with at least one data row.");
      return;
    }

    const newItems = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length < 4) continue;
      const item = {
        id: nextId + newItems.length,
        name: values[0].trim(),
        quantity: parseInt(values[1]) || 0,
        costPrice: parseFloat(values[2]) || 0,
        sellingPrice: parseFloat(values[3]) || 0,
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

  // Render page
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <div className="dashboard">
            <h1 className="page-title">📊 Dashboard</h1>

            <div className="financial-summary">
              <div className="financial-card">
                <h3>Capital in Stock</h3>
                <p className="financial-number">
                  {formatCurrency(totalStockValue)}
                </p>
              </div>
              <div className="financial-card">
                <h3>Potential Revenue</h3>
                <p className="financial-number">
                  {formatCurrency(totalPotentialRevenue)}
                </p>
              </div>
              <div className="financial-card profit">
                <h3>Potential Profit</h3>
                <p className="financial-number">
                  {formatCurrency(totalPotentialProfit)}
                </p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Items</h3>
                <p className="stat-number">{totalItems}</p>
              </div>
              <div className="stat-card">
                <h3>Today's Sales</h3>
                <p className="stat-number">{formatCurrency(todayRevenue)}</p>
              </div>
              <div className="stat-card profit">
                <h3>Today's Profit</h3>
                <p className="stat-number">{formatCurrency(todayProfit)}</p>
              </div>
              <div className="stat-card">
                <h3>Month Sales</h3>
                <p className="stat-number">{formatCurrency(monthRevenue)}</p>
              </div>
            </div>

            <div className="quick-actions">
              <button
                onClick={() => setCurrentPage("record-sale")}
                className="quick-action-btn sale"
              >
                Record Sale
              </button>
              <button
                onClick={() => setCurrentPage("record-purchase")}
                className="quick-action-btn purchase"
              >
                Record Purchase
              </button>
              <button
                onClick={() => setCurrentPage("reports")}
                className="quick-action-btn report"
              >
                View Reports
              </button>
              <button
                onClick={() => setCurrentPage("bulk-import")}
                className="quick-action-btn import"
              >
                Bulk Import
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
                <p className="success-message">Backup restored!</p>
              )}
            </div>
          </div>
        );
      case "inventory":
        return (
          <div className="inventory-page">
            <h1 className="page-title">📦 Inventory</h1>

                        <div className="filters">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Sort by Name</option>
                <option value="quantity">Sort by Quantity</option>
                <option value="profit">Sort by Profit</option>
                <option value="date">Sort by Date (Newest First)</option>
              </select>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setFormData({ name: '', quantity: '', costPrice: '', sellingPrice: '' });
                  setCurrentPage('add-item');
                }}
                className="add-item-btn"
              >
                ➕ Add Item
              </button>
            </div>

            <div className="inventory-table-header">
              <span className="col-name">Name</span>
              <span className="col-num">Stock</span>
              <span className="col-num">Cost</span>
              <span className="col-num">Sell</span>
              <span className="col-num">Profit</span>
              <span className="col-actions"></span>
            </div>

            <div className="inventory-list">
              {filteredItems.map((item) => {
                const profitPerUnit = item.sellingPrice - item.costPrice;
                return (
                  <div key={item.id} className="inventory-row">
                    <span className="col-name" title={item.name}>
                      {item.name}
                    </span>
                    <span className="col-num">{item.quantity}</span>
                    <span className="col-num">{item.costPrice}</span>
                    <span className="col-num">{item.sellingPrice}</span>
                    <span className="col-num profit-text">{profitPerUnit}</span>
                    <span className="col-actions">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="mini-btn"
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="mini-btn"
                      >
                        +
                      </button>
                      <button
                        onClick={() => startEditing(item)}
                        className="mini-btn"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="mini-btn danger"
                      >
                        🗑️
                      </button>
                    </span>
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
                    });
                  }}
                  required
                >
                  <option value="">Select item...</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stock: {item.quantity})
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
                Record Purchase
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
                          {item.name} (Stock: {item.quantity})
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
                      Remove
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
                Add Another Item
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
                Complete Sale
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
                  placeholder="e.g. Cement (50kg bag)"
                />
              </div>
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
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Cost Price (ETB) *</label>
                <input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, costPrice: e.target.value })
                  }
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Selling Price (ETB) *</label>
                <input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, sellingPrice: e.target.value })
                  }
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <button type="submit" className="submit-btn">
                {editingItem ? "Update Item" : "Add Item"}
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
              <code>Name,Quantity,CostPrice,SellingPrice</code>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows="8"
                placeholder="Name,Quantity,CostPrice,SellingPrice&#10;Cement (50kg bag),45,380,450&#10;Steel Rebar,150,720,850"
                className="bulk-textarea"
              />
              <input type="file" accept=".csv,.txt" onChange={handleBulkFile} />
              <button onClick={handleBulkImport} className="submit-btn">
                Import Items
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
