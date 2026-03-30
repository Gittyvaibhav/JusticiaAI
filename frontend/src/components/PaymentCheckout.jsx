import React, { useState, useEffect } from 'react';
import { DollarSign, Gift, CheckCircle } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

export default function PaymentCheckout({ caseId, lawyerId, lawyerName, lawyerFee, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [pricingType, setPricingType] = useState('fixed');
  const [amount, setAmount] = useState(lawyerFee || 0);
  const [milestones, setMilestones] = useState([
    { title: 'Initial Consultation', amount: Math.round(lawyerFee * 0.2) },
    { title: 'Case Filing', amount: Math.round(lawyerFee * 0.3) },
    { title: 'Court Hearing', amount: Math.round(lawyerFee * 0.3) },
    { title: 'Case Resolution', amount: Math.round(lawyerFee * 0.2) },
  ]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const paymentData = {
        caseId,
        lawyerId,
        amount: pricingType === 'milestone' ? milestones.reduce((sum, m) => sum + m.amount, 0) : amount,
        pricingType,
        milestones: pricingType === 'milestone' ? milestones : [],
        paymentMethod: 'card',
      };

      const response = await api.post('/payments/create', paymentData);

      toast.success('Payment processed! Case assigned to lawyer.');
      onSuccess?.(response.data.payment);
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMilestoneChange = (index, field, value) => {
    const newMilestones = [...milestones];
    newMilestones[index][field] = field === 'amount' ? parseInt(value) : value;
    setMilestones(newMilestones);
  };

  const totalMilestones = milestones.reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Hire {lawyerName}</h2>

        <form onSubmit={handlePayment} className="space-y-4">
          {/* Pricing Type */}
          <div>
            <label className="block font-semibold mb-3">Pricing Type</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="fixed"
                  checked={pricingType === 'fixed'}
                  onChange={(e) => setPricingType(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-semibold">Fixed Fee</div>
                  <div className="text-sm text-gray-600">Pay one-time fee</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="milestone"
                  checked={pricingType === 'milestone'}
                  onChange={(e) => setPricingType(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-semibold">Milestone-Based</div>
                  <div className="text-sm text-gray-600">Pay as work completes</div>
                </div>
              </label>
            </div>
          </div>

          {/* Fixed Pricing */}
          {pricingType === 'fixed' && (
            <div>
              <label className="block font-semibold mb-2">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value))}
                className="w-full border rounded px-3 py-2 text-lg font-semibold"
                min="0"
                required
              />
            </div>
          )}

          {/* Milestone-Based Pricing */}
          {pricingType === 'milestone' && (
            <div className="space-y-3">
              <label className="block font-semibold">Milestones</label>
              {milestones.map((milestone, index) => (
                <div key={index} className="border rounded p-3 space-y-2">
                  <input
                    type="text"
                    value={milestone.title}
                    onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                    placeholder="Milestone"
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="number"
                    value={milestone.amount}
                    onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                    placeholder="Amount"
                    className="w-full border rounded px-2 py-1 text-sm"
                    min="0"
                  />
                </div>
              ))}
              <div className="bg-blue-50 p-3 rounded font-semibold">
                Total: ₹{totalMilestones.toLocaleString()}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded space-y-2">
            <div className="flex justify-between">
              <span>Amount to Pay</span>
              <span className="font-bold text-lg">
                ₹{(pricingType === 'milestone' ? totalMilestones : amount).toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Money held in escrow until case completion
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <DollarSign size={18} />
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
