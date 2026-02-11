interface SummaryCardProps {
  title: string
  amount: number
  type: 'income' | 'expense' | 'balance'
}

export default function SummaryCard({ title, amount, type }: SummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const getColorClass = () => {
    switch (type) {
      case 'income':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'expense':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'balance':
        return amount >= 0
          ? 'bg-blue-50 border-blue-200 text-blue-800'
          : 'bg-orange-50 border-orange-200 text-orange-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'income':
        return '📈'
      case 'expense':
        return '📉'
      case 'balance':
        return '💰'
      default:
        return '📊'
    }
  }

  return (
    <div className={`rounded-lg border-2 p-2 md:p-6 ${getColorClass()}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] md:text-sm font-medium opacity-75">{title}</p>
          <p className="text-base md:text-2xl font-bold mt-0.5 md:mt-2">{formatCurrency(amount)}</p>
        </div>
        <div className="text-xl md:text-4xl">{getIcon()}</div>
      </div>
    </div>
  )
}

