// src/components/common/Table.jsx
const Table = ({ columns, data, onRowClick, actions }) => {
  if (!data.length) {
    return <div className="empty-state">No items found</div>;
  }

  return (
    <table className="inventory-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
          {actions && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr
            key={row.id}
            onClick={() => onRowClick?.(row)}
            className={row.quantity <= row.minStockLevel ? "low-stock" : ""}
          >
            {columns.map((col) => (
              <td key={col.key}>
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
            {actions && (
              <td onClick={(e) => e.stopPropagation()}>{actions(row)}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
