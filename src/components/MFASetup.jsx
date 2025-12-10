/**
 * MFA (Multi-Factor Authentication) Setup Component
 *
 * Provides UI for:
 * - Initiating MFA setup (QR code display)
 * - Verifying TOTP code to complete setup
 * - Displaying backup codes (one-time)
 * - Disabling MFA
 * - Regenerating backup codes
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  QrCode,
  Key,
  Copy,
  Download,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Eye,
  EyeOff,
  Smartphone
} from 'lucide-react';
import authService from '../services/authService';
import { useLocalization } from '../context/LocalizationContext';

const MFASetup = ({ onClose, onStatusChange }) => {
  const { t } = useLocalization();
  const [step, setStep] = useState('status'); // status, setup, verify, backup, disable
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // MFA Status
  const [mfaStatus, setMfaStatus] = useState(null);

  // Setup data
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // Backup codes
  const [backupCodes, setBackupCodes] = useState([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Disable MFA
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [usePasswordToDisable, setUsePasswordToDisable] = useState(true);

  // Load MFA status on mount
  useEffect(() => {
    loadMfaStatus();
  }, []);

  const loadMfaStatus = async () => {
    setLoading(true);
    try {
      const status = await authService.getMfaStatus();
      setMfaStatus(status);
    } catch (err) {
      setError(t('failedToLoadMfaStatus'));
    } finally {
      setLoading(false);
    }
  };

  const handleStartSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authService.setupMfa();
      setSetupData(data);
      setStep('setup');
    } catch (err) {
      setError(err.message || t('failedToStartMfaSetup'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async (e) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setError(t('pleaseEnter6DigitCode'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await authService.verifyMfaSetup(verificationCode);
      setBackupCodes(result.backupCodes);
      setStep('backup');
      onStatusChange?.(true);
    } catch (err) {
      setError(err.message || t('invalidVerificationCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.disableMfa(
        usePasswordToDisable ? disablePassword : null,
        !usePasswordToDisable ? disableCode : null
      );
      setMfaStatus({ ...mfaStatus, enabled: false });
      setStep('status');
      onStatusChange?.(false);
    } catch (err) {
      setError(err.message || t('failedToDisableMfa'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const code = prompt(t('enterMfaCodeToRegenerateBackupCodes'));
    if (!code) return;

    setLoading(true);
    setError('');
    try {
      const result = await authService.regenerateBackupCodes(code);
      setBackupCodes(result.backupCodes);
      setStep('backup');
    } catch (err) {
      setError(err.message || t('failedToRegenerateBackupCodes'));
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const downloadBackupCodes = () => {
    const text = `${t('pbmSystemMfaBackupCodes')}
${t('generated')}: ${new Date().toLocaleString()}

${t('backupCodesFileWarning')}

${backupCodes.join('\n')}
`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pbm-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render based on current step
  const renderContent = () => {
    switch (step) {
      case 'status':
        return renderStatus();
      case 'setup':
        return renderSetup();
      case 'verify':
        return renderVerify();
      case 'backup':
        return renderBackupCodes();
      case 'disable':
        return renderDisable();
      default:
        return renderStatus();
    }
  };

  const renderStatus = () => (
    <div className="mfa-status">
      <div className={`mfa-status-badge ${mfaStatus?.enabled ? 'enabled' : 'disabled'}`}>
        {mfaStatus?.enabled ? (
          <>
            <ShieldCheck size={48} />
            <h3>{t('mfaEnabled')}</h3>
            <p>{t('mfaEnabledDescription')}</p>
          </>
        ) : (
          <>
            <ShieldOff size={48} />
            <h3>{t('mfaDisabled')}</h3>
            <p>{t('mfaDisabledDescription')}</p>
          </>
        )}
      </div>

      {mfaStatus?.enabled && (
        <div className="mfa-info">
          <div className="info-row">
            <span>{t('lastUsed')}:</span>
            <span>{mfaStatus.lastUsed ? new Date(mfaStatus.lastUsed).toLocaleString() : t('never')}</span>
          </div>
          <div className="info-row">
            <span>{t('backupCodesRemaining')}:</span>
            <span className={mfaStatus.backupCodesRemaining <= 2 ? 'warning' : ''}>
              {mfaStatus.backupCodesRemaining}/10
            </span>
          </div>
          {mfaStatus.backupCodesRemaining <= 2 && (
            <div className="warning-message">
              <AlertTriangle size={16} />
              <span>{t('lowBackupCodesWarning')}</span>
            </div>
          )}
        </div>
      )}

      <div className="mfa-actions">
        {mfaStatus?.enabled ? (
          <>
            <button
              className="btn btn-secondary"
              onClick={handleRegenerateBackupCodes}
              disabled={loading}
            >
              <RefreshCw size={18} />
              {t('regenerateBackupCodes')}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => setStep('disable')}
              disabled={loading}
            >
              <ShieldOff size={18} />
              {t('disableMfa')}
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleStartSetup}
            disabled={loading}
          >
            <Shield size={18} />
            {loading ? t('settingUp') : t('enableMfa')}
          </button>
        )}
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className="mfa-setup">
      <div className="setup-instructions">
        <Smartphone size={24} />
        <h3>{t('step1ScanQrCode')}</h3>
        <p>{t('scanQrCodeDescription')}</p>
      </div>

      {setupData?.qrCode && (
        <div className="qr-container">
          <img src={setupData.qrCode} alt={t('mfaQrCode')} className="qr-code" />
        </div>
      )}

      <div className="manual-entry">
        <p>{t('cantScanManualEntry')}</p>
        <div className="secret-display">
          <code>{showSecret ? setupData?.secret : '••••••••••••••••'}</code>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setShowSecret(!showSecret)}
          >
            {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => {
              navigator.clipboard.writeText(setupData?.secret);
            }}
          >
            <Copy size={18} />
          </button>
        </div>
      </div>

      <div className="setup-instructions">
        <Key size={24} />
        <h3>{t('step2EnterVerificationCode')}</h3>
        <p>{t('enterVerificationCodeDescription')}</p>
      </div>

      <form onSubmit={handleVerifySetup}>
        <div className="code-input-container">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="code-input"
            autoComplete="one-time-code"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="setup-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setStep('status');
              setSetupData(null);
              setVerificationCode('');
            }}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || verificationCode.length !== 6}
          >
            {loading ? t('verifying') : t('verifyAndEnable')}
          </button>
        </div>
      </form>
    </div>
  );

  const renderBackupCodes = () => (
    <div className="mfa-backup-codes">
      <div className="success-header">
        <ShieldCheck size={48} className="success-icon" />
        <h3>{t('mfaEnabledSuccessfully')}</h3>
      </div>

      <div className="warning-box">
        <AlertTriangle size={20} />
        <div>
          <strong>{t('saveYourBackupCodes')}</strong>
          <p>{t('backupCodesDescription')}</p>
        </div>
      </div>

      <div className="backup-codes-grid">
        {backupCodes.map((code, index) => (
          <div key={index} className="backup-code">
            {code}
          </div>
        ))}
      </div>

      <div className="backup-actions">
        <button className="btn btn-secondary" onClick={copyBackupCodes}>
          {copiedCodes ? <Check size={18} /> : <Copy size={18} />}
          {copiedCodes ? t('copied') : t('copyCodes')}
        </button>
        <button className="btn btn-secondary" onClick={downloadBackupCodes}>
          <Download size={18} />
          {t('download')}
        </button>
      </div>

      <button
        className="btn btn-primary done-btn"
        onClick={() => {
          setStep('status');
          setBackupCodes([]);
          loadMfaStatus();
        }}
      >
        {t('iveSavedMyCodes')}
      </button>
    </div>
  );

  const renderDisable = () => (
    <div className="mfa-disable">
      <div className="warning-header">
        <AlertTriangle size={48} className="warning-icon" />
        <h3>{t('disableMfaQuestion')}</h3>
        <p>{t('disableMfaWarning')}</p>
      </div>

      <form onSubmit={handleDisableMfa}>
        <div className="auth-method-toggle">
          <button
            type="button"
            className={`toggle-btn ${usePasswordToDisable ? 'active' : ''}`}
            onClick={() => setUsePasswordToDisable(true)}
          >
            {t('usePassword')}
          </button>
          <button
            type="button"
            className={`toggle-btn ${!usePasswordToDisable ? 'active' : ''}`}
            onClick={() => setUsePasswordToDisable(false)}
          >
            {t('useMfaCode')}
          </button>
        </div>

        {usePasswordToDisable ? (
          <div className="form-group">
            <label>{t('currentPassword')}</label>
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder={t('enterYourPassword')}
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label>{t('mfaCode')}</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
            />
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="disable-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setStep('status');
              setDisablePassword('');
              setDisableCode('');
            }}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-danger"
            disabled={loading || (usePasswordToDisable ? !disablePassword : disableCode.length !== 6)}
          >
            {loading ? t('disabling') : t('disableMfa')}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="mfa-setup-modal">
      <div className="mfa-modal-header">
        <Shield size={24} />
        <h2>{t('twoFactorAuthentication')}</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        )}
      </div>

      <div className="mfa-modal-content">
        {loading && step === 'status' ? (
          <div className="loading">{t('loading')}</div>
        ) : (
          renderContent()
        )}
      </div>

      <style jsx>{`
        .mfa-setup-modal {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .mfa-modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .mfa-modal-header h2 {
          flex: 1;
          margin: 0;
          font-size: 1.25rem;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
        }

        .close-btn:hover {
          color: #1f2937;
        }

        .mfa-modal-content {
          padding: 24px;
        }

        .mfa-status-badge {
          text-align: center;
          padding: 32px;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .mfa-status-badge.enabled {
          background: #ecfdf5;
          color: #065f46;
        }

        .mfa-status-badge.disabled {
          background: #fef3c7;
          color: #92400e;
        }

        .mfa-status-badge h3 {
          margin: 16px 0 8px;
        }

        .mfa-status-badge p {
          margin: 0;
          opacity: 0.8;
        }

        .mfa-info {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-row .warning {
          color: #dc2626;
          font-weight: 600;
        }

        .warning-message {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #dc2626;
          font-size: 0.875rem;
          margin-top: 12px;
        }

        .mfa-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #b91c1c;
        }

        .setup-instructions {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 24px;
        }

        .setup-instructions h3 {
          margin: 12px 0 8px;
        }

        .setup-instructions p {
          margin: 0;
          color: #6b7280;
        }

        .qr-container {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .qr-code {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px;
          background: white;
        }

        .manual-entry {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 32px;
          text-align: center;
        }

        .manual-entry p {
          margin: 0 0 12px;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .secret-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .secret-display code {
          font-family: monospace;
          font-size: 1rem;
          background: white;
          padding: 8px 16px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
        }

        .btn-icon:hover {
          color: #2563eb;
        }

        .code-input-container {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .code-input {
          font-size: 2rem;
          font-family: monospace;
          text-align: center;
          letter-spacing: 0.5em;
          width: 200px;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
        }

        .code-input:focus {
          outline: none;
          border-color: #2563eb;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          text-align: center;
        }

        .setup-actions {
          display: flex;
          gap: 12px;
        }

        .setup-actions .btn {
          flex: 1;
        }

        .success-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .success-icon {
          color: #059669;
        }

        .warning-box {
          display: flex;
          gap: 12px;
          background: #fef3c7;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .warning-box strong {
          display: block;
          margin-bottom: 4px;
        }

        .warning-box p {
          margin: 0;
          font-size: 0.875rem;
        }

        .backup-codes-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }

        .backup-code {
          font-family: monospace;
          font-size: 1rem;
          text-align: center;
          padding: 12px;
          background: #f9fafb;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .backup-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .backup-actions .btn {
          flex: 1;
        }

        .done-btn {
          width: 100%;
        }

        .warning-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .warning-icon {
          color: #dc2626;
        }

        .warning-header p {
          color: #6b7280;
        }

        .auth-method-toggle {
          display: flex;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 24px;
        }

        .toggle-btn {
          flex: 1;
          padding: 8px;
          border: none;
          background: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
        }

        .toggle-btn.active {
          background: white;
          color: #1f2937;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
        }

        .form-group input:focus {
          outline: none;
          border-color: #2563eb;
        }

        .disable-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .disable-actions .btn {
          flex: 1;
        }

        .loading {
          text-align: center;
          padding: 48px;
          color: #6b7280;
        }

        @media (prefers-color-scheme: dark) {
          .mfa-setup-modal {
            background: #1f2937;
          }

          .mfa-modal-header {
            border-color: #374151;
            color: #f9fafb;
          }

          .mfa-status-badge.disabled {
            background: #451a03;
          }

          .mfa-info {
            background: #374151;
          }

          .info-row {
            border-color: #4b5563;
          }

          .btn-secondary {
            background: #374151;
            color: #f9fafb;
          }

          .manual-entry {
            background: #374151;
          }

          .secret-display code {
            background: #1f2937;
            border-color: #4b5563;
            color: #f9fafb;
          }

          .code-input {
            background: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }

          .backup-code {
            background: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }

          .auth-method-toggle {
            background: #374151;
          }

          .toggle-btn {
            color: #9ca3af;
          }

          .toggle-btn.active {
            background: #4b5563;
            color: #f9fafb;
          }

          .form-group label {
            color: #f9fafb;
          }

          .form-group input {
            background: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }
        }
      `}</style>
    </div>
  );
};

export default MFASetup;
