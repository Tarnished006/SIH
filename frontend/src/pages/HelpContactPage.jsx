import React from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { Phone, Mail, MapPin, Clock, HelpCircle, FileText, ExternalLink } from 'lucide-react';

export const HelpContactPage = () => {
  const { language } = useLanguage();

  return (
    <AppLayout title={language === 'kn' ? 'ಸಹಾಯ ಮತ್ತು ಸಂಪರ್ಕ' : 'Help & Contact'} desktopExpanded={true}>
      <div className="gov-page-container">
        {/* Header */}
        <div className="gov-page-header">
          <div>
            <h1 className="gov-page-title">
              {language === 'kn' ? 'ಸಹಾಯ ಮತ್ತು ಸಾರ್ವಜನಿಕ ಸಂಪರ್ಕ ಕೇಂದ್ರ' : 'Help & Citizen Support'}
            </h1>
            <p className="gov-page-subtitle">
              {language === 'kn'
                ? 'ಕರ್ನಾಟಕ ಭೂಮಿ ಭೂ ದಾಖಲೆಗಳು, ಅರ್ಜಿ ಸಲ್ಲಿಕೆ ಮತ್ತು ಪಹಣಿ ಸೇವೆಗಳ ಅಧಿಕೃತ ಸಹಾಯವಾಣಿ.'
                : 'Official assistance for Bhoomi land records, mutation status tracking, and revenue inquiries.'}
            </p>
          </div>
        </div>

        {/* Support Channels Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* Channel 1: Toll Free Helpline */}
          <div className="gov-section" style={{ margin: 0 }}>
            <div className="gov-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={15} color="var(--color-primary)" />
                <h3>{language === 'kn' ? 'ಭೂಮಿ ರಾಜ್ಯ ಸಹಾಯವಾಣಿ' : 'State Bhoomi Helpline'}</h3>
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                1902
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {language === 'kn' ? 'ಶುಲ್ಕ ರಹಿತ ಸಹಾಯವಾಣಿ (ಬೆಳಿಗ್ಗೆ ೯:೦೦ ರಿಂದ ಸಂಜೆ ೬:೦೦)' : 'Toll-Free Number (Mon - Sat, 09:00 AM - 06:00 PM)'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Alternative: 080-22113251 / 080-22113252
              </div>
            </div>
          </div>

          {/* Channel 2: Taluk Office */}
          <div className="gov-section" style={{ margin: 0 }}>
            <div className="gov-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} color="var(--color-primary)" />
                <h3>{language === 'kn' ? 'ತಾಲ್ಲೂಕು ಕಂದಾಯ ಕಚೇರಿ' : 'Local Taluk Office'}</h3>
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Office of the Tahsildar, Magadi Taluk
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Mini Vidhana Soudha, Magadi, Ramanagara District - 562120
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Email: tahsildar.magadi@karnataka.gov.in
              </div>
            </div>
          </div>

          {/* Channel 3: Nada Kacheri */}
          <div className="gov-section" style={{ margin: 0 }}>
            <div className="gov-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} color="var(--color-primary)" />
                <h3>{language === 'kn' ? 'ನಾಡಕಛೇರಿ ಸಂಪರ್ಕ ಸಮಯ' : 'Nada Kacheri Desk'}</h3>
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Kasaba & Thippagondanahalli Circle
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Village Accountant (Patwari) Consultation: Tuesdays & Fridays (10 AM - 1 PM)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Public Grievance Hearing: Every Wednesday at Taluk Office
              </div>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="gov-section">
          <div className="gov-section-header">
            <h3>{language === 'kn' ? 'ಪದೇ ಪದೇ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು (FAQs)' : 'Frequently Asked Questions (Bhoomi Services)'}</h3>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                1. How do I get a certified copy of my RTC (Pahani)?
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                Navigate to <strong>My Land Records</strong>, click on your survey number, and select <strong>Download Certified RTC (Form 16)</strong>. Certified copies are digitally signed by the Revenue Department under the Karnataka Electronic Delivery of Citizen Services Act.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                2. What is the statutory timeline for Mutation approval?
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                Under Section 129 of the Karnataka Land Revenue Act, a 30-day public notice period is required for objections. If no genuine boundary dispute or objection is registered, the Tehsildar approves the mutation within 45 days.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                3. What should I do if the survey number or extent shows a discrepancy?
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                You can apply for <em>Tad-Rupa</em> (record correction) through your local Nada Kacheri or submit an online correction request with supporting title deed evidence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default HelpContactPage;
