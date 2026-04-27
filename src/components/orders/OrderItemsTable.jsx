export default function OrderItemsTable({ items }) {
  if (!items?.length) return <p className="text-sm text-gray-400">No items.</p>

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-gray-500 border-b border-border-default">
          <th className="pb-2 font-medium">Description</th>
          <th className="pb-2 font-medium">Qty</th>
          <th className="pb-2 font-medium">Colour</th>
          <th className="pb-2 font-medium">Size</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i} className="border-b border-border-default last:border-0">
            <td className="py-2 text-gray-900">{item.description}</td>
            <td className="py-2 text-gray-700">{item.quantity}</td>
            <td className="py-2 text-gray-700">{item.colour || '—'}</td>
            <td className="py-2 text-gray-700">{item.size || 'Assorted'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
