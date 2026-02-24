export default function Accounts() {
  const accounts = [
    {
      id: 1,
      name: 'Main Trading Account',
      balance: '$125,432.50',
      currency: 'USD',
      type: 'Premium',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Crypto Wallet',
      balance: '$45,200.00',
      currency: 'Mixed',
      type: 'Standard',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Day Trading Account',
      balance: '$23,500.00',
      currency: 'USD',
      type: 'Premium',
      status: 'Active'
    },
    {
      id: 4,
      name: 'Savings Account',
      balance: '$50,000.00',
      currency: 'USD',
      type: 'Savings',
      status: 'Inactive'
    },
  ]

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1>Accounts</h1>
          <p className="text-gray-400 mt-2">Manage your trading accounts and wallets</p>
        </div>
        <button className="btn-secondary">+ New Account</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {accounts.map((account) => (
          <div key={account.id} className="card-hover group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3>{account.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{account.type}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                account.status === 'Active' ? 'bg-primary-500' : 'bg-gray-600'
              }`} />
            </div>

            <div className="my-6">
              <p className="text-gray-400 text-sm mb-2">Balance</p>
              <p className="text-3xl font-bold text-accent-400">{account.balance}</p>
              <p className="text-sm text-gray-500 mt-1">{account.currency}</p>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-2 px-3 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors text-sm font-medium">
                Deposit
              </button>
              <button className="flex-1 py-2 px-3 bg-dark-700 text-gray-400 rounded-lg hover:text-primary-400 transition-colors text-sm font-medium">
                Withdraw
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Account Details Table */}
      <div className="card">
        <h3>Account Summary</h3>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Account Name</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Type</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Balance</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-dark-700 hover:bg-dark-700 transition-colors">
                  <td className="py-3 px-4">{account.name}</td>
                  <td className="py-3 px-4">
                    <span className="badge-primary">{account.type}</span>
                  </td>
                  <td className="py-3 px-4 text-primary-300 font-semibold">{account.balance}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      account.status === 'Active'
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'bg-gray-600/20 text-gray-400'
                    }`}>
                      {account.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-primary-400 hover:text-primary-300 text-sm">
                      View Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
