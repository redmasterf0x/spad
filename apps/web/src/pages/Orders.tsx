export default function Orders() {
  const orders = [
    {
      id: 'ORD-001',
      symbol: 'AAPL',
      type: 'Buy',
      quantity: '100',
      price: '$185.50',
      total: '$18,550.00',
      status: 'Filled',
      date: '2026-02-24'
    },
    {
      id: 'ORD-002',
      symbol: 'MSFT',
      type: 'Sell',
      quantity: '50',
      price: '$420.00',
      total: '$21,000.00',
      status: 'Filled',
      date: '2026-02-24'
    },
    {
      id: 'ORD-003',
      symbol: 'GOOGL',
      type: 'Buy',
      quantity: '25',
      price: '$140.00',
      total: '$3,500.00',
      status: 'Pending',
      date: '2026-02-24'
    },
    {
      id: 'ORD-004',
      symbol: 'TSLA',
      type: 'Buy',
      quantity: '10',
      price: '$245.50',
      total: '$2,455.00',
      status: 'Cancelled',
      date: '2026-02-23'
    },
    {
      id: 'ORD-005',
      symbol: 'BTC',
      type: 'Buy',
      quantity: '0.5',
      price: '$65,000',
      total: '$32,500.00',
      status: 'Filled',
      date: '2026-02-23'
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Filled':
        return 'bg-primary-500/20 text-primary-400'
      case 'Pending':
        return 'bg-accent-500/20 text-accent-400'
      case 'Cancelled':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-600/20 text-gray-400'
    }
  }

  const getTypeColor = (type: string) => {
    return type === 'Buy' ? 'text-primary-400' : 'text-red-400'
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1>Orders</h1>
          <p className="text-gray-400 mt-2">View and manage your trading orders</p>
        </div>
        <button className="btn-primary">+ New Order</button>
      </div>

      {/* Orders Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Orders', value: '287', color: 'primary' },
          { label: 'Filled Orders', value: '275', color: 'accent' },
          { label: 'Pending Orders', value: '8', color: 'yellow' },
          { label: 'Cancelled Orders', value: '4', color: 'red' },
        ].map((stat, idx) => (
          <div key={idx} className="card">
            <p className="text-gray-400 text-sm">{stat.label}</p>
            <p className={`text-2xl font-bold mt-2 ${
              stat.color === 'primary' ? 'text-primary-400' : 
              stat.color === 'accent' ? 'text-accent-400' :
              stat.color === 'yellow' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3>Recent Orders</h3>
          <select className="bg-dark-700 text-gray-300 px-3 py-2 rounded-lg border border-dark-600 text-sm hover:border-primary-500 transition-colors">
            <option>All Status</option>
            <option>Filled</option>
            <option>Pending</option>
            <option>Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Order ID</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Symbol</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Type</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Quantity</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Price</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Total</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-dark-700 hover:bg-dark-700 transition-colors">
                  <td className="py-3 px-4 text-primary-400 font-mono text-sm">{order.id}</td>
                  <td className="py-3 px-4 font-semibold">{order.symbol}</td>
                  <td className={`py-3 px-4 font-semibold ${getTypeColor(order.type)}`}>
                    {order.type}
                  </td>
                  <td className="py-3 px-4">{order.quantity}</td>
                  <td className="py-3 px-4 text-accent-400">{order.price}</td>
                  <td className="py-3 px-4 font-semibold text-primary-300">{order.total}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
