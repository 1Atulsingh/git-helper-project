import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Payment = () => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // This would be passed from the Repository component in a real implementation
  const price = localStorage.getItem('easygit_current_price') || '2.99';
  
  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    setError('');
  };
  
  const processPayment = async () => {
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    
    try {
      setLoading(true);
      
      // In a real implementation, we would integrate with the payment processor APIs
      // For now, we'll simulate a successful payment
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful payment
      const success = true;
      
      if (success) {
        // Store payment success in localStorage for the Repository component to use
        localStorage.setItem('easygit_payment_success', 'true');
        
        // Navigate back to repository page
        navigate('/repository');
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      setError('Error processing payment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="payment">
      <h2>Payment</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="card">
        <h3>Complete Your Payment</h3>
        <p>Select a payment method to continue with your repository update.</p>
        
        <div className="price-display" style={{ marginBottom: '1.5rem' }}>
          ${price}
        </div>
        
        <div className="payment-options">
          <div 
            className={`payment-option ${paymentMethod === 'stripe' ? 'selected' : ''}`}
            onClick={() => handlePaymentMethodSelect('stripe')}
          >
            <h4>Stripe</h4>
            <p>Pay with credit or debit card</p>
          </div>
          
          <div 
            className={`payment-option ${paymentMethod === 'paypal' ? 'selected' : ''}`}
            onClick={() => handlePaymentMethodSelect('paypal')}
          >
            <h4>PayPal</h4>
            <p>Pay with your PayPal account</p>
          </div>
          
          <div 
            className={`payment-option ${paymentMethod === 'wise' ? 'selected' : ''}`}
            onClick={() => handlePaymentMethodSelect('wise')}
          >
            <h4>Wise</h4>
            <p>Pay with Wise transfer</p>
          </div>
        </div>
        
        <div style={{ marginTop: '1.5rem' }}>
          <button 
            className="btn-primary" 
            onClick={processPayment} 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Complete Payment'}
          </button>
          
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/repository')} 
            disabled={loading}
            style={{ marginLeft: '0.5rem' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
