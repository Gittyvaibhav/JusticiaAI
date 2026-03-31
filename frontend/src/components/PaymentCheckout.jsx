import { useMemo, useState } from 'react';
import { CheckCircle, Landmark, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import './PaymentCheckout.css';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    const existingScript = document.getElementById('razorpay-checkout-script');

    if (existingScript) {
      resolve(Boolean(window.Razorpay));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentCheckout({ caseId, lawyerId, lawyerName, lawyerFee, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [pricingType, setPricingType] = useState('fixed');
  const [amount, setAmount] = useState(lawyerFee || 0);
  const [milestones, setMilestones] = useState([
    { title: 'Initial Consultation', amount: Math.round((lawyerFee || 0) * 0.2) },
    { title: 'Case Filing', amount: Math.round((lawyerFee || 0) * 0.3) },
    { title: 'Court Hearing', amount: Math.round((lawyerFee || 0) * 0.3) },
    { title: 'Case Resolution', amount: Math.round((lawyerFee || 0) * 0.2) },
  ]);

  const payableAmount = useMemo(
    () => (pricingType === 'milestone'
      ? milestones.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : Number(amount) || 0),
    [amount, milestones, pricingType]
  );

  const handleMilestoneChange = (index, field, value) => {
    setMilestones((current) => {
      const next = [...current];
      next[index] = {
        ...next[index],
        [field]: field === 'amount' ? Number(value) || 0 : value,
      };
      return next;
    });
  };

  const handlePayment = async (event) => {
    event.preventDefault();

    if (payableAmount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    setLoading(true);

    try {
      const isRazorpayLoaded = await loadRazorpayScript();

      if (!isRazorpayLoaded || !window.Razorpay) {
        throw new Error('Unable to load Razorpay checkout');
      }

      const [{ data: config }, { data: orderResponse }] = await Promise.all([
        api.get('/payments/config'),
        api.post('/payments/create-order', {
          caseId,
          lawyerId,
          amount: payableAmount,
          pricingType,
          milestones: pricingType === 'milestone' ? milestones : [],
          paymentMethod: 'card',
        }),
      ]);

      const options = {
        key: config.keyId,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: 'JusticiaAI',
        description: `Legal services for ${lawyerName}`,
        order_id: orderResponse.order.id,
        prefill: {
          name: JSON.parse(localStorage.getItem('user') || '{}')?.name || '',
          email: JSON.parse(localStorage.getItem('user') || '{}')?.email || '',
          contact: JSON.parse(localStorage.getItem('user') || '{}')?.phone || '',
        },
        notes: {
          caseId,
          lawyerId,
        },
        theme: {
          color: '#0f766e',
        },
        handler: async (response) => {
          try {
            const verification = await api.post('/payments/verify', response);
            toast.success('Payment successful and case assigned to lawyer');
            onSuccess?.(verification.data);
            onClose?.();
          } catch (error) {
            toast.error(error.response?.data?.error || 'Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const checkout = new window.Razorpay(options);
      checkout.on('payment.failed', (response) => {
        setLoading(false);
        toast.error(response.error?.description || 'Payment failed');
      });
      checkout.open();
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.error || error.message || 'Unable to start payment');
    }
  };

  return (
    <div className="payment-checkout">
      <div className="payment-checkout__dialog">
        <div className="payment-checkout__hero">
          <p className="payment-checkout__eyebrow">Secure Checkout</p>
          <h2 className="payment-checkout__title">Hire {lawyerName}</h2>
          <p className="payment-checkout__subtitle">
            Payments are initiated through Razorpay and verified on the server before the case is assigned.
          </p>
        </div>

        <form onSubmit={handlePayment} className="payment-checkout__form">
          <div>
            <label className="payment-checkout__label">Pricing Type</label>
            <div className="payment-checkout__options">
              <label className="payment-checkout__option">
                <input
                  type="radio"
                  value="fixed"
                  checked={pricingType === 'fixed'}
                  onChange={(event) => setPricingType(event.target.value)}
                  className="payment-checkout__radio"
                />
                <div>
                  <div className="payment-checkout__option-title">Fixed Fee</div>
                  <div className="payment-checkout__option-copy">Single upfront payment for this matter.</div>
                </div>
              </label>

              <label className="payment-checkout__option">
                <input
                  type="radio"
                  value="milestone"
                  checked={pricingType === 'milestone'}
                  onChange={(event) => setPricingType(event.target.value)}
                  className="payment-checkout__radio"
                />
                <div>
                  <div className="payment-checkout__option-title">Milestone-Based</div>
                  <div className="payment-checkout__option-copy">Break payment into delivery milestones.</div>
                </div>
              </label>
            </div>
          </div>

          {pricingType === 'fixed' ? (
            <div>
              <label className="payment-checkout__label payment-checkout__label--compact">Amount (INR)</label>
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value) || 0)}
                className="payment-checkout__amount"
                min="1"
                required
              />
            </div>
          ) : (
            <div className="payment-checkout__milestones">
              <label className="payment-checkout__label payment-checkout__label--compact">Milestones</label>
              {milestones.map((milestone, index) => (
                <div key={index} className="payment-checkout__milestone-row">
                  <input
                    type="text"
                    value={milestone.title}
                    onChange={(event) => handleMilestoneChange(index, 'title', event.target.value)}
                    placeholder="Milestone title"
                    className="payment-checkout__input"
                  />
                  <input
                    type="number"
                    value={milestone.amount}
                    onChange={(event) => handleMilestoneChange(index, 'amount', event.target.value)}
                    placeholder="Amount"
                    className="payment-checkout__input"
                    min="0"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="payment-checkout__summary">
            <div className="payment-checkout__summary-header">
              <div>
                <p className="payment-checkout__summary-title">Amount to pay</p>
                <p className="payment-checkout__summary-copy">Charged in INR via Razorpay Standard Checkout.</p>
              </div>
              <p className="payment-checkout__summary-amount">INR {payableAmount.toLocaleString()}</p>
            </div>

            <div className="payment-checkout__benefits">
              <p className="payment-checkout__benefit">
                <ShieldCheck className="payment-checkout__benefit-icon payment-checkout__benefit-icon--emerald" />
                Server-side signature verification before case assignment
              </p>
              <p className="payment-checkout__benefit">
                <Landmark className="payment-checkout__benefit-icon payment-checkout__benefit-icon--blue" />
                Payment record stored with Razorpay order and payment IDs
              </p>
              <p className="payment-checkout__benefit">
                <CheckCircle className="payment-checkout__benefit-icon payment-checkout__benefit-icon--amber" />
                Case moves to assigned only after successful verification
              </p>
            </div>
          </div>

          <div className="payment-checkout__actions">
            <button type="button" onClick={onClose} className="payment-checkout__button payment-checkout__button--secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="payment-checkout__button payment-checkout__button--primary">
              {loading ? 'Starting Checkout...' : 'Pay with Razorpay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
