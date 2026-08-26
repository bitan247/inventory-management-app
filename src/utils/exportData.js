export const exportToCSV = (items) => {
  const headers = ["SKU,Name,Category,Quantity,Price,Supplier"];
  const rows = items.map(
    (item) =>
      `${item.sku},${item.name},${item.category},${item.quantity},${item.price},${item.supplier}`,
  );

  const csv = [...headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inventory.csv";
  a.click();
};
