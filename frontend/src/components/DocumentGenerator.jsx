import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

export default function DocumentGenerator() {
  const [documentType, setDocumentType] = useState('petition');
  const [loading, setLoading] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [templates, setTemplates] = useState([]);

  const [formData, setFormData] = useState({
    caseDetails: '',
    parties: '',
    content: '',
  });

  React.useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/documents/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/documents/generate-document', {
        documentType,
        caseDetails: formData.caseDetails,
        parties: formData.parties,
        content: formData.content,
      });

      setGeneratedDoc(response.data);
      toast.success('Document generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error generating document');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = () => {
    if (!generatedDoc) return;

    const element = document.createElement('a');
    const file = new Blob([generatedDoc.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${documentType}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText size={28} />
        AI Legal Document Generator
      </h2>

      {!generatedDoc ? (
        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Document Type */}
          <div>
            <label className="block font-semibold mb-2">Select Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
          </div>

          {/* Case Details */}
          <div>
            <label className="block font-semibold mb-2">Case Details</label>
            <textarea
              value={formData.caseDetails}
              onChange={(e) => setFormData({ ...formData, caseDetails: e.target.value })}
              placeholder="Describe the case details, facts, and circumstances..."
              rows={4}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Parties */}
          <div>
            <label className="block font-semibold mb-2">Parties Involved</label>
            <textarea
              value={formData.parties}
              onChange={(e) => setFormData({ ...formData, parties: e.target.value })}
              placeholder="List all parties involved (petitioner, respondent, witnesses, etc.)"
              rows={3}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Additional Content */}
          <div>
            <label className="block font-semibold mb-2">Additional Information</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Any additional details, amounts, dates, etc."
              rows={3}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded font-semibold transition-colors"
          >
            {loading ? 'Generating Document...' : 'Generate Document'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Generated Document Preview */}
          <div>
            <label className="block font-semibold mb-2">Generated Document</label>
            <div className="border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800">
                {generatedDoc.content}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setGeneratedDoc(null)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded font-semibold transition-colors"
            >
              Generate New
            </button>
            <button
              onClick={downloadDocument}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
