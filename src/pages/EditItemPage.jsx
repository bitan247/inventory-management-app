import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInventory } from "../contexts/InventoryContext";

function EditItemPage() {
  const { id } = useParams();
  const { items, updateItem } = useInventory();
  const navigate = useNavigate();

  const item = items.find((i) => i.id === parseInt(id));

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    quantity: "",
    price: "",
    minStockLevel: "",
    supplier: "",
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  if (!item) return <div>Item not found</div>;

  const handleSubmit = (e) => {
    e.preventDefault();
    updateItem(parseInt(id), formData);
    navigate("/inventory");
  };

  // Rest of the form is same as AddItemPage but with update logic
  return (
    <div className="add-item-page">
      <h1>Edit Item: {item.name}</h1>
      <form onSubmit={handleSubmit} className="add-item-form">
        {/* Same form fields as AddItemPage but with formData values */}
        <button type="submit" className="submit-btn">
          Update Item
        </button>
      </form>
    </div>
  );
}
