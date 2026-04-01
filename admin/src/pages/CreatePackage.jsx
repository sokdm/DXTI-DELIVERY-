import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  User, 
  MapPin, 
  DollarSign, 
  Upload,
  Loader2,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReceiptModal from '../components/ReceiptModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CreatePackage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [createdPackage, setCreatedPackage] = useState(null);
  
  const [formData, setFormData] = useState({
    packageName: '',
    packageDescription: '',
    packageWeight: '',
    senderName: '',
    senderPhone: '',
    senderEmail: '',
    senderAddress: '',
    senderCountry: '',
    senderCity: '',
    receiverName: '',
    receiverPhone: '',
    receiverEmail: '',
    receiverAddress: '',
    receiverCountry: '',
    receiverCity: '',
    receiverGender: 'male',
    deliveryPrice: '',
    currentLocation: { lat: '', lng: '', locationName: '' },
    destinationLocation: { lat: '', lng: '', locationName: '' },
  });
  
  const [imageFile, setImageFile] = useState(null);

  const handleChange = (e, section = null) => {
    const { name, value } = e.target;
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [name]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'object') {
          data.append(key, JSON.stringify(formData[key]));
        } else {
          data.append(key, formData[key]);
        }
      });
      
      if (imageFile) {
        data.append('packageImage', imageFile);
      }

      const response = await axios.post(`${API_URL}/packages/create`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Package created successfully!');
      
      // Store created package data and show receipt
      setCreatedPackage(response.data.data.package);
      setShowReceipt(true);
      
      // Reset form
      setFormData({
        packageName: '',
        packageDescription: '',
        packageWeight: '',
        senderName: '',
        senderPhone: '',
        senderEmail: '',
        senderAddress: '',
        senderCountry: '',
        senderCity: '',
        receiverName: '',
        receiverPhone: '',
        receiverEmail: '',
        receiverAddress: '',
        receiverCountry: '',
        receiverCity: '',
        receiverGender: 'male',
        deliveryPrice: '',
        currentLocation: { lat: '', lng: '', locationName: '' },
        destinationLocation: { lat: '', lng: '', locationName: '' },
      });
      setPreviewImage(null);
      setImageFile(null);
      setStep(1);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Package Details', icon: Package },
    { number: 2, title: 'Sender Info', icon: User },
    { number: 3, title: 'Receiver Info', icon: User },
    { number: 4, title: 'Delivery Info', icon: MapPin },
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Package Image *
              </label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-admin-primary transition-colors">
                {previewImage ? (
                  <div className="relative">
                    <img src={previewImage} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <button
                      type="button"
                      onClick={() => { setPreviewImage(null); setImageFile(null); }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                    <span className="text-slate-500 dark:text-slate-400">Click to upload package image</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" required />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Package Name *
              </label>
              <input type="text" name="packageName" value={formData.packageName} onChange={handleChange} className="admin-input" placeholder="e.g., Electronics Box" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description *
              </label>
              <textarea name="packageDescription" value={formData.packageDescription} onChange={handleChange} className="admin-input" rows="3" placeholder="Describe the package contents" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Weight (kg) *
              </label>
              <input type="number" step="0.1" name="packageWeight" value={formData.packageWeight} onChange={handleChange} className="admin-input" placeholder="e.g., 2.5" required />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-admin-primary" />
              Sender Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name *</label>
                <input type="text" name="senderName" value={formData.senderName} onChange={handleChange} className="admin-input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone *</label>
                <input type="tel" name="senderPhone" value={formData.senderPhone} onChange={handleChange} className="admin-input" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email *</label>
              <input type="email" name="senderEmail" value={formData.senderEmail} onChange={handleChange} className="admin-input" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address *</label>
              <input type="text" name="senderAddress" value={formData.senderAddress} onChange={handleChange} className="admin-input" required />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">City *</label>
                <input type="text" name="senderCity" value={formData.senderCity} onChange={handleChange} className="admin-input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Country *</label>
                <input type="text" name="senderCountry" value={formData.senderCountry} onChange={handleChange} className="admin-input" required />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-green-500" />
              Receiver Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name *</label>
                <input type="text" name="receiverName" value={formData.receiverName} onChange={handleChange} className="admin-input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gender *</label>
                <select name="receiverGender" value={formData.receiverGender} onChange={handleChange} className="admin-input" required>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone *</label>
                <input type="tel" name="receiverPhone" value={formData.receiverPhone} onChange={handleChange} className="admin-input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email *</label>
                <input type="email" name="receiverEmail" value={formData.receiverEmail} onChange={handleChange} className="admin-input" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address *</label>
              <input type="text" name="receiverAddress" value={formData.receiverAddress} onChange={handleChange} className="admin-input" required />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">City *</label>
                <input type="text" name="receiverCity" value={formData.receiverCity} onChange={handleChange} className="admin-input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Country *</label>
                <input type="text" name="receiverCountry" value={formData.receiverCountry} onChange={handleChange} className="admin-input" required />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Delivery Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Delivery Price ($) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="number" step="0.01" name="deliveryPrice" value={formData.deliveryPrice} onChange={handleChange} className="admin-input pl-12" placeholder="0.00" required />
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h4 className="font-medium text-slate-900 dark:text-white mb-4">Current Location</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Latitude *</label>
                  <input type="number" step="any" name="lat" value={formData.currentLocation.lat} onChange={(e) => handleChange(e, 'currentLocation')} className="admin-input" required />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Longitude *</label>
                  <input type="number" step="any" name="lng" value={formData.currentLocation.lng} onChange={(e) => handleChange(e, 'currentLocation')} className="admin-input" required />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Location Name *</label>
                  <input type="text" name="locationName" value={formData.currentLocation.locationName} onChange={(e) => handleChange(e, 'currentLocation')} className="admin-input" placeholder="e.g., New York, USA" required />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h4 className="font-medium text-slate-900 dark:text-white mb-4">Destination Location</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Latitude *</label>
                  <input type="number" step="any" name="lat" value={formData.destinationLocation.lat} onChange={(e) => handleChange(e, 'destinationLocation')} className="admin-input" required />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Longitude *</label>
                  <input type="number" step="any" name="lng" value={formData.destinationLocation.lng} onChange={(e) => handleChange(e, 'destinationLocation')} className="admin-input" required />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Location Name *</label>
                  <input type="text" name="locationName" value={formData.destinationLocation.locationName} onChange={(e) => handleChange(e, 'destinationLocation')} className="admin-input" placeholder="e.g., Los Angeles, USA" required />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <button
                onClick={() => setStep(s.number)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  step === s.number
                    ? 'bg-gradient-to-r from-admin-primary to-admin-secondary text-white'
                    : step > s.number
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">{s.title}</span>
                {step > s.number && <CheckCircle className="w-4 h-4 ml-1" />}
              </button>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${step > s.number ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="admin-card">
          {renderStep()}

          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="admin-btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            
            {step < 4 ? (
              <button type="button" onClick={() => setStep(step + 1)} className="admin-btn">
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="admin-btn flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    Create Package
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* Receipt Modal */}
      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        packageData={createdPackage} 
      />
    </>
  );
};

export default CreatePackage;
