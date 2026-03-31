import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';
import './DocumentGenerator.css';

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
    const fetchTemplates = async () => {
      try {
        const response = await api.get('/documents/templates');
        setTemplates(response.data);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    fetchTemplates();
  }, []);

  const handleGenerate = async (event) => {
    event.preventDefault();
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
    if (!generatedDoc) {
      return;
    }

    const element = document.createElement('a');
    const file = new Blob([generatedDoc.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${documentType}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="document-generator">
      <h2 className="document-generator__heading">
        <FileText size={28} />
        AI Legal Document Generator
      </h2>

      {!generatedDoc ? (
        <form onSubmit={handleGenerate} className="document-generator__form">
          <div>
            <label className="document-generator__label">Select Document Type</label>
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              className="document-generator__input"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="document-generator__label">Case Details</label>
            <textarea
              value={formData.caseDetails}
              onChange={(event) => setFormData({ ...formData, caseDetails: event.target.value })}
              placeholder="Describe the case details, facts, and circumstances..."
              rows={4}
              className="document-generator__input document-generator__input--textarea"
              required
            />
          </div>

          <div>
            <label className="document-generator__label">Parties Involved</label>
            <textarea
              value={formData.parties}
              onChange={(event) => setFormData({ ...formData, parties: event.target.value })}
              placeholder="List all parties involved (petitioner, respondent, witnesses, etc.)"
              rows={3}
              className="document-generator__input document-generator__input--textarea"
              required
            />
          </div>

          <div>
            <label className="document-generator__label">Additional Information</label>
            <textarea
              value={formData.content}
              onChange={(event) => setFormData({ ...formData, content: event.target.value })}
              placeholder="Any additional details, amounts, dates, etc."
              rows={3}
              className="document-generator__input document-generator__input--textarea"
            />
          </div>

          <button type="submit" disabled={loading} className="document-generator__submit">
            {loading ? 'Generating Document...' : 'Generate Document'}
          </button>
        </form>
      ) : (
        <div className="document-generator__preview">
          <div>
            <label className="document-generator__label">Generated Document</label>
            <div className="document-generator__preview-box">
              <pre className="document-generator__preview-text">{generatedDoc.content}</pre>
            </div>
          </div>

          <div className="document-generator__actions">
            <button type="button" onClick={() => setGeneratedDoc(null)} className="document-generator__button document-generator__button--secondary">
              Generate New
            </button>
            <button type="button" onClick={downloadDocument} className="document-generator__button document-generator__button--primary">
              <Download size={18} />
              Download Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
