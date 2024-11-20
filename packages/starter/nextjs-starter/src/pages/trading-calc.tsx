import { useState } from 'react';
import styles from '../styles/Calc.module.css';


const TradingCalc = () => {
  const [accountSize, setAccountSize] = useState<string>('');
  const [riskPercent, setRiskPercent] = useState<string>('');
  const [stopLossPercent, setStopLossPercent] = useState<string>('');
  const [marginAvailable, setMarginAvailable] = useState<string>('');

  const [tradeSize, setTradeSize] = useState<number | null>(null);
  const [leverage, setLeverage] = useState<number | null>(null);
  const [lossAmount, setLossAmount] = useState<number | null>(null);
  const [newAccountValue, setNewAccountValue] = useState<number | null>(null);
  const [buttonText, setButtonText] = useState<string>('Calculate');
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (isCalculated) {
      setButtonText('Recalculate');
    }
  };

  const calculateTrade = () => {
    const accountSizeNum = parseFloat(accountSize);
    const riskPercentNum = parseFloat(riskPercent);
    const stopLossPercentNum = parseFloat(stopLossPercent);
    const marginAvailableNum = parseFloat(marginAvailable);

    if (
      isNaN(accountSizeNum) ||
      isNaN(riskPercentNum) ||
      isNaN(stopLossPercentNum) ||
      isNaN(marginAvailableNum)
    ) {
      alert('Please enter valid numbers for all parameters.');
      return;
    }

    const riskAmount = (accountSizeNum * riskPercentNum) / 100;
    const calculatedTradeSize = riskAmount / (stopLossPercentNum / 100);
    const calculatedLeverage = calculatedTradeSize / marginAvailableNum;
    const calculatedLossAmount = riskAmount;
    const calculatedNewAccountValue = accountSizeNum - calculatedLossAmount;

    setTradeSize(calculatedTradeSize);
    setLeverage(calculatedLeverage);
    setLossAmount(calculatedLossAmount);
    setNewAccountValue(calculatedNewAccountValue);

    setButtonText('Calculate');
    setIsCalculated(true);
  };

  const clearValues = () => {
    setAccountSize('');
    setRiskPercent('');
    setStopLossPercent('');
    setMarginAvailable('');
    setTradeSize(null);
    setLeverage(null);
    setLossAmount(null);
    setNewAccountValue(null);
    setButtonText('Calculate');
    setIsCalculated(false);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Trading Calculator</h1>
      <div className={styles.inputGroup}>
        <label className={styles.label}>
          Account Size (USD):
          <input
            className={styles.input}
            type="text"
            value={accountSize}
            onChange={handleInputChange(setAccountSize)}
          />
        </label>
      </div>
      <div className={styles.inputGroup}>
        <label className={styles.label}>
          Risk % of Account:
          <input
            className={styles.input}
            type="text"
            value={riskPercent}
            onChange={handleInputChange(setRiskPercent)}
          />
        </label>
      </div>
      <div className={styles.inputGroup}>
        <label className={styles.label}>
          Stop Loss % from Entry:
          <input
            className={styles.input}
            type="text"
            value={stopLossPercent}
            onChange={handleInputChange(setStopLossPercent)}
          />
        </label>
      </div>
      <div className={styles.inputGroup}>
        <label className={styles.label}>
          Margin Available (USD):
          <input
            className={styles.input}
            type="text"
            value={marginAvailable}
            onChange={handleInputChange(setMarginAvailable)}
          />
        </label>
      </div>
      <div className={styles.buttonGroup}>
        <button className={styles.calculateButton} onClick={calculateTrade}>
          {buttonText}
        </button>
        <button className={styles.clearButton} onClick={clearValues}>
          Clear
        </button>
      </div>

      {tradeSize !== null && leverage !== null && lossAmount !== null && newAccountValue !== null && (
        <div className={styles.results}>
          <h3>Results:</h3>
          <p>
            <strong>Trade Size:</strong> ${tradeSize.toFixed(2)}
          </p>
          <p>
            <strong>Leverage Needed:</strong> {leverage.toFixed(2)}x
          </p>
          <p>
            <strong>Account Size (USD):</strong> ${accountSize}
          </p>
          <p>
            <strong>Risk % of Account:</strong> {riskPercent}%
          </p>
          <p>
            <strong>Stop Loss % from Entry:</strong> {stopLossPercent}%
          </p>
          <p>
            <strong>Margin Available (USD):</strong> ${marginAvailable}
          </p>
          <p>
            <strong>Potential Loss (if stop loss is hit):</strong> ${lossAmount.toFixed(2)}
          </p>
          <p>
            <strong>New Account Value (after loss):</strong> ${newAccountValue.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};

export default TradingCalc;

// forcing commit

