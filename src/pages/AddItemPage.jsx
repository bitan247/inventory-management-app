import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInventory } from "../contexts/InventoryContext";

function AddItemPage() {
  const { addItem } = useInventory();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    quantity: "",
    price: "",
    minStockLevel: "",
    supplier: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  // Add this validation in AddItemPage before handleSubmit:
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.sku) newErrors.sku = "SKU is required";
    if (formData.price < 0) newErrors.price = "Price must be positive";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.sku) {
      addItem(formData);
      navigate("/inventory");
    }
  };

  return (
    <div className="add-item-page">
      <h1>Add New Item</h1>

      <form onSubmit={handleSubmit} className="add-item-form">
        <div className="form-group">
          <label>Item Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter item name"
          />
        </div>

        <div className="form-group">
          <label>SKU *</label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            required
            placeholder="Enter SKU"
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Select Category</option>
            <option value="Electronics">Electronics</option>
            <option value="Furniture">Furniture</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="0"
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label>Price ($)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label>Min Stock Level</label>
          <input
            type="number"
            name="minStockLevel"
            value={formData.minStockLevel}
            onChange={handleChange}
            min="0"
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label>Supplier</label>
          <input
            type="text"
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            placeholder="Enter supplier name"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            Add Item
          </button>
          <button
            type="button"
            onClick={() => navigate("/inventory")}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddItemPage;
