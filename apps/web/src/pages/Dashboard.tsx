export default function Dashboard() {
  const stats = [
    { label: 'Account Balance', value: '$125,432.50', change: '+2.5%', icon: '💰' },
    { label: 'Active Positions', value: '12', change: '+3', icon: '📈' },
    { label: 'Total Orders', value: '287', change: '+45', icon: '📊' },
    { label: 'Daily P&L', value: '$4,250.00', change: '+1.2%', icon: '💸' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1>Dashboard</h1>
        <p className="text-gray-400 mt-2">Welcome back! Here's your trading overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                <p className="text-2xl font-bold text-primary-300">{stat.value}</p>
                <p className="text-sm text-accent-400 mt-2">{stat.change}</p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3>Account Value Over Time</h3>
          <div className="mt-6 h-64 flex items-end justify-around bg-dark-900 rounded-lg p-4">
            {[45, 52, 48, 65, 58, 72, 68, 75].map((height, idx) => (
              <div
                key={idx}
                className="flex-1 mx-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${height * 3}px` }}
              />
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Portfolio Allocation</h3>
          <div className="mt-6 flex items-center justify-center gap-8">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="70 100"
                  className="text-primary-500"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="20 100"
                  strokeDashoffset="-70"
                  className="text-accent-500"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="10 100"
                  strokeDashoffset="-90"
                  className="text-green-600"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-xl font-bold text-primary-400">100%</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-sm">Stocks 70%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent-500" />
                <span className="text-sm">Crypto 20%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600" />
                <span className="text-sm">Forex 10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3>Recent Transactions</h3>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Type</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Amount</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'Buy', amount: '$5,000', status: 'Completed', date: 'Today' },
                { type: 'Sell', amount: '$3,250', status: 'Completed', date: 'Yesterday' },
                { type: 'Deposit', amount: '$10,000', status: 'Pending', date: '2 days ago' },
                { type: 'Withdrawal', amount: '$2,500', status: 'Completed', date: '3 days ago' },
              ].map((tx, idx) => (
                <tr key={idx} className="border-b border-dark-700 hover:bg-dark-700 transition-colors">
                  <td className="py-3 px-4">{tx.type}</td>
                  <td className="py-3 px-4 text-primary-400 font-semibold">{tx.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      tx.status === 'Completed'
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'bg-accent-500/20 text-accent-400'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
