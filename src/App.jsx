import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import "./App.css";

// Convert database row → app item
const dbToItem = (row) => ({
  id: row.id,
  name: row.name,
  quantity: row.quantity,
  costPrice: parseFloat(row.cost_price) || 0,
  sellingPrice: parseFloat(row.selling_price) || 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const dbToPurchase = (row) => ({
  id: row.id,
  itemId: row.item_id,
  itemName: row.item_name,
  quantity: row.quantity,
  costPrice: parseFloat(row.cost_price) || 0,
  totalCost: parseFloat(row.total_cost) || 0,
  date: row.date,
  timestamp: row.created_at,
});

const dbToSale = (row) => ({
  id: row.id,
  items: row.items,
  customerName: row.customer_name,
  date: row.date,
  discount: parseFloat(row.discount) || 0,
  totalSale: parseFloat(row.total_sale) || 0,
  totalCost: parseFloat(row.total_cost) || 0,
  profit: parseFloat(row.profit) || 0,
  timestamp: row.created_at,
});

const dbToCustomer = (row) => ({
  id: row.id,
  name: row.name,
  totalPurchases: parseFloat(row.total_purchases) || 0,
  lastPurchaseDate: row.last_purchase_date,
});

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | error | offline

  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");

  const [bulkText, setBulkText] = useState("");
  const importFileRef = useRef(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    costPrice: "",
    sellingPrice: "",
  });

  const [editingItem, setEditingItem] = useState(null);

  const [purchaseForm, setPurchaseForm] = useState({
    itemSearch: "",
    itemId: "",
    isNewItem: false,
    sellingPrice: "",
    quantity: "",
    costPrice: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [saleForm, setSaleForm] = useState({
    items: [{ itemSearch: "", itemId: "", quantity: "", sellingPrice: "" }],
    customerName: "",
    date: new Date().toISOString().split("T")[0],
    discount: 0,
  });

  // LOAD DATA FROM SUPABASE
  const loadAll = async () => {
    setLoading(true);
    setSyncStatus("syncing");
    try {
      const [itemsRes, purchasesRes, salesRes, customersRes] =
        await Promise.all([
          supabase
            .from("items")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("purchases")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("sales")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("customers").select("*"),
        ]);

      if (itemsRes.error) throw itemsRes.error;
      if (purchasesRes.error) throw purchasesRes.error;
      if (salesRes.error) throw salesRes.error;
      if (customersRes.error) throw customersRes.error;

      setItems(itemsRes.data.map(dbToItem));
      setPurchases(purchasesRes.data.map(dbToPurchase));
      setSales(salesRes.data.map(dbToSale));
      setCustomers(customersRes.data.map(dbToCustomer));
      setSyncStatus("idle");

      // Cache to localStorage for offline reading
      localStorage.setItem("cache-items", JSON.stringify(itemsRes.data));
      localStorage.setItem(
        "cache-purchases",
        JSON.stringify(purchasesRes.data),
      );
      localStorage.setItem("cache-sales", JSON.stringify(salesRes.data));
      localStorage.setItem(
        "cache-customers",
        JSON.stringify(customersRes.data),
      );
    } catch (err) {
      console.error("Load failed:", err);
      setSyncStatus("offline");
      // Fall back to localStorage cache
      const cItems = localStorage.getItem("cache-items");
      const cPurch = localStorage.getItem("cache-purchases");
      const cSales = localStorage.getItem("cache-sales");
      const cCust = localStorage.getItem("cache-customers");
      if (cItems) setItems(JSON.parse(cItems).map(dbToItem));
      if (cPurch) setPurchases(JSON.parse(cPurch).map(dbToPurchase));
      if (cSales) setSales(JSON.parse(cSales).map(dbToSale));
      if (cCust) setCustomers(JSON.parse(cCust).map(dbToCustomer));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ADD / UPDATE ITEM
  const addItem = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    const now = new Date().toISOString();

    if (editingItem) {
      const { data, error } = await supabase
        .from("items")
        .update({
          name: formData.name,
          quantity: parseInt(formData.quantity) || 0,
          cost_price: parseFloat(formData.costPrice) || 0,
          selling_price: parseFloat(formData.sellingPrice) || 0,
          updated_at: now,
        })
        .eq("id", editingItem.id)
        .select()
        .single();

      if (error) {
        alert("Error updating: " + error.message);
        return;
      }
      setItems(
        items.map((item) =>
          item.id === editingItem.id ? dbToItem(data) : item,
        ),
      );
      setEditingItem(null);
    } else {
      const { data, error } = await supabase
        .from("items")
        .insert({
          name: formData.name,
          quantity: parseInt(formData.quantity) || 0,
          cost_price: parseFloat(formData.costPrice) || 0,
          selling_price: parseFloat(formData.sellingPrice) || 0,
        })
        .select()
        .single();

      if (error) {
        alert("Error adding: " + error.message);
        return;
      }
      setItems([dbToItem(data), ...items]);
    }

    setFormData({ name: "", quantity: "", costPrice: "", sellingPrice: "" });
    setCurrentPage("inventory");
  };

  // RECORD PURCHASE
  const recordPurchase = async (e) => {
    e.preventDefault();
    const now = new Date().toISOString();

    // Case: New item
    if (purchaseForm.isNewItem) {
      if (!purchaseForm.itemSearch.trim()) {
        alert("Please enter an item name.");
        return;
      }
      if (
        !purchaseForm.quantity ||
        !purchaseForm.costPrice ||
        !purchaseForm.sellingPrice
      ) {
        alert("Please fill quantity, cost price, and selling price.");
        return;
      }

      // Create the item
      const { data: newItemData, error: itemErr } = await supabase
        .from("items")
        .insert({
          name: purchaseForm.itemSearch.trim(),
          quantity: parseInt(purchaseForm.quantity) || 0,
          cost_price: parseFloat(purchaseForm.costPrice) || 0,
          selling_price: parseFloat(purchaseForm.sellingPrice) || 0,
        })
        .select()
        .single();

      if (itemErr) {
        alert("Error adding item: " + itemErr.message);
        return;
      }

      // Record the purchase
      const { data: purchData, error: purchErr } = await supabase
        .from("purchases")
        .insert({
          item_id: newItemData.id,
          item_name: newItemData.name,
          quantity: newItemData.quantity,
          cost_price: parseFloat(newItemData.cost_price),
          total_cost: newItemData.quantity * parseFloat(newItemData.cost_price),
          date: purchaseForm.date,
        })
        .select()
        .single();

      if (purchErr) {
        alert("Error recording purchase: " + purchErr.message);
        return;
      }

      setItems([dbToItem(newItemData), ...items]);
      setPurchases([dbToPurchase(purchData), ...purchases]);
      setPurchaseForm({
        itemSearch: "",
        itemId: "",
        isNewItem: false,
        sellingPrice: "",
        quantity: "",
        costPrice: "",
        date: new Date().toISOString().split("T")[0],
      });
      alert('New item "' + newItemData.name + '" added and purchase recorded.');
      return;
    }

    // Case: Existing item
    if (!purchaseForm.itemId) {
      alert("Please select an item from the suggestions, or add a new one.");
      return;
    }
    const item = items.find((i) => i.id === parseInt(purchaseForm.itemId));
    if (!item) {
      alert("Item not found.");
      return;
    }
    if (!purchaseForm.quantity) {
      alert("Please enter a quantity.");
      return;
    }

    const qty = parseInt(purchaseForm.quantity);
    const cost = parseFloat(purchaseForm.costPrice);

    const { data: purchData, error: purchErr } = await supabase
      .from("purchases")
      .insert({
        item_id: item.id,
        item_name: item.name,
        quantity: qty,
        cost_price: cost,
        total_cost: qty * cost,
        date: purchaseForm.date,
      })
      .select()
      .single();

    if (purchErr) {
      alert("Error: " + purchErr.message);
      return;
    }

    const { data: updatedItem, error: itemErr } = await supabase
      .from("items")
      .update({
        quantity: item.quantity + qty,
        cost_price: cost,
        updated_at: now,
      })
      .eq("id", item.id)
      .select()
      .single();

    if (itemErr) {
      alert("Error: " + itemErr.message);
      return;
    }

    setPurchases([dbToPurchase(purchData), ...purchases]);
    setItems(items.map((i) => (i.id === item.id ? dbToItem(updatedItem) : i)));
    setPurchaseForm({
      itemSearch: "",
      itemId: "",
      isNewItem: false,
      sellingPrice: "",
      quantity: "",
      costPrice: "",
      date: new Date().toISOString().split("T")[0],
    });
    alert("Added " + qty + " of " + item.name + " to stock.");
  };

  // RECORD SALE
  const recordSale = async (e) => {
    e.preventDefault();
    let totalSale = 0;
    let totalCost = 0;
    const saleItems = [];

    for (const saleItem of saleForm.items) {
      if (!saleItem.itemSearch && !saleItem.quantity && !saleItem.itemId)
        continue;

      if (saleItem.itemSearch && !saleItem.itemId) {
        const matches = items.filter((i) =>
          i.name.toLowerCase().includes(saleItem.itemSearch.toLowerCase()),
        );
        if (matches.length === 0) {
          alert('"' + saleItem.itemSearch + '" is not in the stock.');
        } else {
          alert(
            'Please select "' + saleItem.itemSearch + '" from the suggestions.',
          );
        }
        return;
      }

      const item = items.find((i) => i.id === parseInt(saleItem.itemId));
      if (!item) {
        alert("Item not found.");
        return;
      }
      if (!saleItem.quantity) {
        alert("Please enter a quantity for " + item.name);
        return;
      }
      if (parseInt(saleItem.quantity) > item.quantity) {
        alert(
          "Not enough stock for " + item.name + ". Available: " + item.quantity,
        );
        return;
      }

      const quantity = parseInt(saleItem.quantity);
      const sellingPrice =
        parseFloat(saleItem.sellingPrice) || item.sellingPrice;

      saleItems.push({
        itemId: item.id,
        itemName: item.name,
        quantity,
        sellingPrice,
        costPrice: item.costPrice,
        subtotal: quantity * sellingPrice,
      });
      totalSale += quantity * sellingPrice;
      totalCost += quantity * item.costPrice;
    }

    if (saleItems.length === 0) {
      alert("Please add at least one item.");
      return;
    }

    const discountAmount = (totalSale * (saleForm.discount || 0)) / 100;
    const finalTotal = totalSale - discountAmount;

    // Save the sale
    const { data: saleData, error: saleErr } = await supabase
      .from("sales")
      .insert({
        items: saleItems,
        customer_name: saleForm.customerName || "Walk-in Customer",
        date: saleForm.date,
        discount: discountAmount,
        total_sale: finalTotal,
        total_cost: totalCost,
        profit: finalTotal - totalCost,
      })
      .select()
      .single();

    if (saleErr) {
      alert("Error recording sale: " + saleErr.message);
      return;
    }

    // Update each item's quantity
    const now = new Date().toISOString();
    const updatedItems = [...items];
    for (const sItem of saleItems) {
      const item = updatedItems.find((i) => i.id === sItem.itemId);
      if (!item) continue;
      const { data: updated, error } = await supabase
        .from("items")
        .update({ quantity: item.quantity - sItem.quantity, updated_at: now })
        .eq("id", item.id)
        .select()
        .single();
      if (!error && updated) {
        const idx = updatedItems.findIndex((i) => i.id === item.id);
        updatedItems[idx] = dbToItem(updated);
      }
    }
    setItems(updatedItems);
    setSales([dbToSale(saleData), ...sales]);

    // Save customer if named
    if (saleForm.customerName && saleForm.customerName !== "Walk-in Customer") {
      const existing = customers.find(
        (c) => c.name.toLowerCase() === saleForm.customerName.toLowerCase(),
      );
      if (!existing) {
        const { data: newCust } = await supabase
          .from("customers")
          .insert({
            name: saleForm.customerName,
            total_purchases: finalTotal,
            last_purchase_date: saleForm.date,
          })
          .select()
          .single();
        if (newCust) setCustomers([...customers, dbToCustomer(newCust)]);
      } else {
        const { data: updatedCust } = await supabase
          .from("customers")
          .update({
            total_purchases: existing.totalPurchases + finalTotal,
            last_purchase_date: saleForm.date,
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (updatedCust) {
          setCustomers(
            customers.map((c) =>
              c.id === existing.id ? dbToCustomer(updatedCust) : c,
            ),
          );
        }
      }
    }

    setSaleForm({
      items: [{ itemSearch: "", itemId: "", quantity: "", sellingPrice: "" }],
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

  // DELETE ITEM
  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  // QUICK +/- STOCK
  const updateQuantity = async (id, change) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + change);
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("items")
      .update({ quantity: newQty, updated_at: now })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    setItems(items.map((i) => (i.id === id ? dbToItem(data) : i)));
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

  // CALCULATED STATS
  const totalItems = items.length;
  const totalStockValue = items.reduce(
    (t, i) => t + i.costPrice * i.quantity,
    0,
  );
  const totalPotentialRevenue = items.reduce(
    (t, i) => t + i.sellingPrice * i.quantity,
    0,
  );
  const totalPotentialProfit = totalPotentialRevenue - totalStockValue;

  const today = new Date().toISOString().split("T")[0];
  const todaySales = sales.filter((s) => s.date === today);
  const todayRevenue = todaySales.reduce((t, s) => t + s.totalSale, 0);
  const todayProfit = todaySales.reduce((t, s) => t + s.profit, 0);

  const thisMonth = today.substring(0, 7);
  const monthSales = sales.filter((s) => s.date.startsWith(thisMonth));
  const monthRevenue = monthSales.reduce((t, s) => t + s.totalSale, 0);
  const monthProfit = monthSales.reduce((t, s) => t + s.profit, 0);

  const filteredItems = items
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "quantity") return a.quantity - b.quantity;
      if (sortBy === "profit")
        return a.sellingPrice - a.costPrice - (b.sellingPrice - b.costPrice);
      if (sortBy === "date") {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      }
      return 0;
    });

  // EXPORT CSV
  const exportToCSV = () => {
    const headers = "Name,Quantity,CostPrice,SellingPrice";
    const rows = items.map(
      (i) =>
        '"' +
        i.name +
        '",' +
        i.quantity +
        "," +
        i.costPrice +
        "," +
        i.sellingPrice,
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

  // EXPORT BACKUP
  const exportBackup = () => {
    const data = { items, purchases, sales, customers };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buildmart-backup-" + today + ".json";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // IMPORT BACKUP (uploads everything to Supabase)
  const importBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.items) {
          alert("Invalid backup file.");
          return;
        }

        if (
          !window.confirm(
            "This will add " +
              data.items.length +
              " items to the cloud. Continue?",
          )
        )
          return;

        // Insert items
        const itemRows = data.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          cost_price: i.costPrice,
          selling_price: i.sellingPrice,
        }));
        const { data: newItems, error: itemErr } = await supabase
          .from("items")
          .insert(itemRows)
          .select();
        if (itemErr) {
          alert("Error: " + itemErr.message);
          return;
        }

        setItems([...newItems.map(dbToItem), ...items]);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
        alert("Imported " + newItems.length + " items successfully!");
      } catch (err) {
        alert("Error reading file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // BULK IMPORT (direct upload to Supabase)
  const handleBulkImport = async () => {
    const lines = bulkText.trim().split("\n");
    if (lines.length < 2) {
      alert("Please paste CSV data with at least one row.");
      return;
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length < 4) continue;
      rows.push({
        name: values[0].trim(),
        quantity: parseInt(values[1]) || 0,
        cost_price: parseFloat(values[2]) || 0,
        selling_price: parseFloat(values[3]) || 0,
      });
    }

    if (rows.length === 0) {
      alert("No valid rows found.");
      return;
    }

    const { data, error } = await supabase.from("items").insert(rows).select();
    if (error) {
      alert("Error: " + error.message);
      return;
    }

    setItems([...data.map(dbToItem), ...items]);
    setBulkText("");
    alert("Added " + data.length + " items successfully!");
  };

  const handleBulkFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setBulkText(event.target.result);
    reader.readAsText(file);
    e.target.value = "";
  };

  // RENDER PAGE
  const renderPage = () => {
    if (loading) {
      return (
        <div className="loading-screen">
          <h2>Loading inventory...</h2>
          <p>Please wait</p>
        </div>
      );
    }

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
              <button onClick={loadAll} className="backup-btn">
                🔄 Sync Now
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

            <p className="sync-status">Status: {syncStatus}</p>
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
                  setFormData({
                    name: "",
                    quantity: "",
                    costPrice: "",
                    sellingPrice: "",
                  });
                  setCurrentPage("add-item");
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
                <label>Item *</label>
                <input
                  type="text"
                  value={purchaseForm.itemSearch}
                  onChange={(e) =>
                    setPurchaseForm({
                      ...purchaseForm,
                      itemSearch: e.target.value,
                      itemId: "",
                      isNewItem: false,
                      costPrice: "",
                      sellingPrice: "",
                    })
                  }
                  placeholder="Type item name..."
                />
                {purchaseForm.itemId ? (
                  <div className="matched-item">
                    ✅{" "}
                    {
                      items.find((i) => i.id === parseInt(purchaseForm.itemId))
                        ?.name
                    }
                    <button
                      type="button"
                      className="change-item-btn"
                      onClick={() =>
                        setPurchaseForm({
                          ...purchaseForm,
                          itemId: "",
                          itemSearch: "",
                          costPrice: "",
                        })
                      }
                    >
                      change
                    </button>
                  </div>
                ) : purchaseForm.isNewItem ? (
                  <div className="matched-item new-item">
                    🆕 Adding new item: "{purchaseForm.itemSearch}"
                    <button
                      type="button"
                      className="change-item-btn"
                      onClick={() =>
                        setPurchaseForm({
                          ...purchaseForm,
                          isNewItem: false,
                          itemSearch: "",
                          costPrice: "",
                          sellingPrice: "",
                        })
                      }
                    >
                      cancel
                    </button>
                  </div>
                ) : (
                  purchaseForm.itemSearch.trim() && (
                    <div className="suggestion-list">
                      {items
                        .filter((i) =>
                          i.name
                            .toLowerCase()
                            .includes(purchaseForm.itemSearch.toLowerCase()),
                        )
                        .slice(0, 5)
                        .map((match) => (
                          <div
                            key={match.id}
                            className="suggestion-item"
                            onClick={() =>
                              setPurchaseForm({
                                ...purchaseForm,
                                itemId: match.id.toString(),
                                itemSearch: match.name,
                                costPrice: match.costPrice,
                              })
                            }
                          >
                            {match.name}
                            <span className="suggestion-meta">
                              {" "}
                              (Stock: {match.quantity})
                            </span>
                          </div>
                        ))}
                      {items.filter((i) =>
                        i.name
                          .toLowerCase()
                          .includes(purchaseForm.itemSearch.toLowerCase()),
                      ).length === 0 && (
                        <div
                          className="suggestion-item new-item-suggestion"
                          onClick={() =>
                            setPurchaseForm({
                              ...purchaseForm,
                              isNewItem: true,
                            })
                          }
                        >
                          ➕ Add "{purchaseForm.itemSearch}" as a new item
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              {(purchaseForm.itemId || purchaseForm.isNewItem) && (
                <>
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
                  {purchaseForm.isNewItem && (
                    <div className="form-group">
                      <label>Selling Price per Unit *</label>
                      <input
                        type="number"
                        value={purchaseForm.sellingPrice}
                        onChange={(e) =>
                          setPurchaseForm({
                            ...purchaseForm,
                            sellingPrice: e.target.value,
                          })
                        }
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={purchaseForm.date}
                      onChange={(e) =>
                        setPurchaseForm({
                          ...purchaseForm,
                          date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn">
                    {purchaseForm.isNewItem
                      ? "Add Item & Record Purchase"
                      : "Record Purchase"}
                  </button>
                </>
              )}
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

              {saleForm.items.map((saleItem, index) => {
                const matches = saleItem.itemSearch.trim()
                  ? items
                      .filter((i) =>
                        i.name
                          .toLowerCase()
                          .includes(saleItem.itemSearch.toLowerCase()),
                      )
                      .slice(0, 5)
                  : [];
                return (
                  <div key={index} className="sale-item-row">
                    <div className="form-group">
                      <label>Item {index + 1} *</label>
                      <input
                        type="text"
                        value={saleItem.itemSearch}
                        onChange={(e) => {
                          const newItems = [...saleForm.items];
                          newItems[index] = {
                            ...newItems[index],
                            itemSearch: e.target.value,
                            itemId: "",
                            sellingPrice: "",
                          };
                          setSaleForm({ ...saleForm, items: newItems });
                        }}
                        placeholder="Type item name..."
                      />
                      {saleItem.itemId ? (
                        <div className="matched-item">
                          ✅{" "}
                          {
                            items.find(
                              (i) => i.id === parseInt(saleItem.itemId),
                            )?.name
                          }
                          <button
                            type="button"
                            className="change-item-btn"
                            onClick={() => {
                              const newItems = [...saleForm.items];
                              newItems[index] = {
                                ...newItems[index],
                                itemId: "",
                                itemSearch: "",
                                sellingPrice: "",
                              };
                              setSaleForm({ ...saleForm, items: newItems });
                            }}
                          >
                            change
                          </button>
                        </div>
                      ) : (
                        matches.length > 0 && (
                          <div className="suggestion-list">
                            {matches.map((match) => (
                              <div
                                key={match.id}
                                className="suggestion-item"
                                onClick={() => {
                                  const newItems = [...saleForm.items];
                                  newItems[index] = {
                                    ...newItems[index],
                                    itemId: match.id.toString(),
                                    itemSearch: match.name,
                                    sellingPrice: match.sellingPrice,
                                  };
                                  setSaleForm({ ...saleForm, items: newItems });
                                }}
                              >
                                {match.name}
                                <span className="suggestion-meta">
                                  {" "}
                                  (Stock: {match.quantity})
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>

                    {saleItem.itemId && (
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
                    )}

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
                );
              })}

              <button
                type="button"
                onClick={() =>
                  setSaleForm({
                    ...saleForm,
                    items: [
                      ...saleForm.items,
                      {
                        itemSearch: "",
                        itemId: "",
                        quantity: "",
                        sellingPrice: "",
                      },
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
                placeholder="Name,Quantity,CostPrice,SellingPrice&#10;Cement (50kg bag),45,380,450"
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
