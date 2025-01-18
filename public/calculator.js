const MIN_MARGIN = 3;
const LEVERAGE_STEPS = [3, 5, 10, 20];

function PositionCalculator() {
    const [balance, setBalance] = React.useState(0);
    const [maxRiskPercent, setMaxRiskPercent] = React.useState(5);
    const [plannedStopLoss, setPlannedStopLoss] = React.useState(5);
    const [openPositions, setOpenPositions] = React.useState([]);
    const [results, setResults] = React.useState({
        availableBalance: 0,
        maxLossAmount: 0,
        basePositionSize: 0,
        leverageMargins: []
    });

    const calculatePositionParams = () => {
        // Считаем риски по открытым позициям
        const totalRisk = openPositions.reduce((sum, pos) => {
            const positionValue = pos.size * pos.leverage;
            const risk = positionValue * (pos.stopLoss / 100);
            return sum + risk;
        }, 0);

        // Доступный баланс
        const available = balance - totalRisk;

        // Максимальная сумма возможной потери
        const maxLoss = available * (maxRiskPercent / 100);

        // Размер позиции при плече 1×
        const baseSize = maxLoss / (plannedStopLoss / 100);

        // Максимальное возможное плечо
        const maxLeverage = Math.floor(baseSize / MIN_MARGIN);

        // Формируем массив плечей и маржи
        const margins = [];
        for (const lev of LEVERAGE_STEPS) {
            if (lev <= maxLeverage) {
                margins.push({
                    leverage: lev,
                    margin: baseSize / lev,
                    isMax: false
                });
            }
        }

        // Добавляем максимальное плечо если оно больше последнего стандартного
        const lastStandardLeverage = LEVERAGE_STEPS[LEVERAGE_STEPS.length - 1];
        if (maxLeverage > lastStandardLeverage) {
            margins.push({
                leverage: maxLeverage,
                margin: baseSize / maxLeverage,
                isMax: true
            });
        }
        // Или если оно между стандартными значениями
        else if (maxLeverage < lastStandardLeverage && 
                 maxLeverage > LEVERAGE_STEPS[LEVERAGE_STEPS.length - 2]) {
            margins.push({
                leverage: maxLeverage,
                margin: baseSize / maxLeverage,
                isMax: true
            });
        }

        setResults({
            availableBalance: available,
            maxLossAmount: maxLoss,
            basePositionSize: baseSize,
            leverageMargins: margins
        });
    };

    React.useEffect(() => {
        calculatePositionParams();
    }, [balance, openPositions, maxRiskPercent, plannedStopLoss]);

    const addPosition = () => {
        setOpenPositions([...openPositions, {
            size: 0,
            leverage: 1,
            stopLoss: 0
        }]);
    };

    const updatePosition = (index, field, value) => {
        const newPositions = [...openPositions];
        newPositions[index][field] = parseFloat(value) || 0;
        setOpenPositions(newPositions);
    };

    const removePosition = (index) => {
        setOpenPositions(openPositions.filter((_, i) => i !== index));
    };

    return (
        <div className="card">
            <h1 className="text-2xl font-bold mb-6">Position Size Calculator</h1>

            {/* Баланс счета */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                    Account Balance ($)
                </label>
                <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                    placeholder="Enter balance"
                    className="w-full"
                />
            </div>

            {/* Открытые позиции */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-medium">Open Positions</h2>
                    <button onClick={addPosition}>Add Position</button>
                </div>
				
			{openPositions.length > 0 && (
  <div className="grid grid-cols-4 gap-2 mb-2">
    <div>Position Size ($)</div>
    <div>Leverage (×)</div>
    <div>Stop Loss (%)</div>
    <div></div>
  </div>
)}	

                {openPositions.map((position, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 mb-2">
                        <input
                            type="number"
                            value={position.size}
                            onChange={(e) => updatePosition(index, 'size', e.target.value)}
                            placeholder="Position Size ($)"
                        />
                        <input
                            type="number"
                            value={position.leverage}
                            onChange={(e) => updatePosition(index, 'leverage', e.target.value)}
                            placeholder="Leverage"
                        />
                        <input
                            type="number"
                            value={position.stopLoss}
                            onChange={(e) => updatePosition(index, 'stopLoss', e.target.value)}
                            placeholder="Stop Loss %"
                        />
                        <button 
                            onClick={() => removePosition(index)}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* Параметры новой позиции */}
            <div className="mb-6">
                <h2 className="text-xl font-medium mb-4">New Position Parameters</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Max Risk per Trade (%)
                            <span className="block text-sm font-normal text-gray-500">
                                Maximum % of account balance to risk per trade
                            </span>
                        </label>
                        <input
                            type="number"
                            value={maxRiskPercent}
                            onChange={(e) => setMaxRiskPercent(parseFloat(e.target.value) || 0)}
                            placeholder="e.g. 5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Planned Stop Loss (%)
                            <span className="block text-sm font-normal text-gray-500">
                                Distance to stop loss from entry
                            </span>
                        </label>
                        <input
                            type="number"
                            value={plannedStopLoss}
                            onChange={(e) => setPlannedStopLoss(parseFloat(e.target.value) || 0)}
                            placeholder="e.g. 5"
                        />
                    </div>
                </div>
            </div>

            {/* Результаты */}
            <div>
                <h2 className="text-xl font-medium mb-4">Results</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded">
                            Available Balance: ${results.availableBalance.toFixed(2)}
                        </div>
                        <div className="p-4 bg-blue-50 rounded">
                            Max Loss Amount: ${results.maxLossAmount.toFixed(2)}
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded">
                        <div className="font-medium mb-2">
                            Position Size (1×): ${results.basePositionSize.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                            Required margin by leverage:
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {results.leverageMargins.map((item, index) => (
                                <div key={index}>
                                    {item.leverage}× = ${item.margin.toFixed(2)}
                                    {item.isMax && " (max)"}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(<PositionCalculator />, document.getElementById('root'));