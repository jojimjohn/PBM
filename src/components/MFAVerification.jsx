/**
 * MFA Verification Component
 *
 * Used during login when MFA is required.
 * Allows user to enter TOTP code or use backup code.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Shield, Key, AlertCircle, ArrowLeft } from 'lucide-react';

const MFAVerification = ({
  mfaData,
  onVerify,
  onCancel,
  loading = false,
  error = null
}) => {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [useBackupCode]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate code format
    if (!useBackupCode && code.length !== 6) {
      return;
    }

    if (useBackupCode && !code.includes('-')) {
      return;
    }

    onVerify(code, useBackupCode);
  };

  const handleCodeChange = (e) => {
    let value = e.target.value;

    if (!useBackupCode) {
      // TOTP code: only digits, max 6
      value = value.replace(/\D/g, '').slice(0, 6);
    } else {
      // Backup code: uppercase, allow alphanumeric and dash
      value = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    }

    setCode(value);
  };

  return (
    <div className="mfa-verification">
      <div className="mfa-header">
        <Shield size={48} className="mfa-icon" />
        <h2>Two-Factor Authentication</h2>
        <p>
          Hello {mfaData?.firstName}! Enter the verification code from your authenticator app.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="code-type-toggle">
          <button
            type="button"
            className={`toggle-btn ${!useBackupCode ? 'active' : ''}`}
            onClick={() => {
              setUseBackupCode(false);
              setCode('');
            }}
          >
            <Key size={16} />
            Authenticator Code
          </button>
          <button
            type="button"
            className={`toggle-btn ${useBackupCode ? 'active' : ''}`}
            onClick={() => {
              setUseBackupCode(true);
              setCode('');
            }}
          >
            <Key size={16} />
            Backup Code
          </button>
        </div>

        <div className="code-input-container">
          {!useBackupCode ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              className="code-input totp"
              autoComplete="one-time-code"
              disabled={loading}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="XXXX-XXXX"
              className="code-input backup"
              disabled={loading}
            />
          )}
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary verify-btn"
          disabled={loading || (!useBackupCode && code.length !== 6) || (useBackupCode && !code.includes('-'))}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      <button
        type="button"
        className="btn btn-link back-btn"
        onClick={onCancel}
        disabled={loading}
      >
        <ArrowLeft size={18} />
        Back to Login
      </button>

      <style jsx>{`
        .mfa-verification {
          width: 100%;
          max-width: 400px;
          padding: 32px;
        }

        .mfa-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .mfa-icon {
          color: #2563eb;
          margin-bottom: 16px;
        }

        .mfa-header h2 {
          margin: 0 0 12px;
          font-size: 1.5rem;
          color: #1f2937;
        }

        .mfa-header p {
          margin: 0;
          color: #6b7280;
          font-size: 0.95rem;
        }

        .code-type-toggle {
          display: flex;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 24px;
        }

        .toggle-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 12px;
          border: none;
          background: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
        }

        .toggle-btn.active {
          background: white;
          color: #1f2937;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .toggle-btn:hover:not(.active) {
          color: #4b5563;
        }

        .code-input-container {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .code-input {
          font-family: monospace;
          text-align: center;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          transition: border-color 0.2s;
        }

        .code-input:focus {
          outline: none;
          border-color: #2563eb;
        }

        .code-input.totp {
          font-size: 2.5rem;
          letter-spacing: 0.3em;
          width: 220px;
          padding: 16px;
        }

        .code-input.backup {
          font-size: 1.5rem;
          letter-spacing: 0.1em;
          width: 200px;
          padding: 14px;
        }

        .code-input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .error-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #fef2f2;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 0.9rem;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
          border: none;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-primary:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .btn-link {
          background: none;
          border: none;
          color: #6b7280;
          margin-top: 16px;
        }

        .btn-link:hover:not(:disabled) {
          color: #1f2937;
        }

        .btn-link:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .verify-btn {
          margin-top: 8px;
        }

        @media (prefers-color-scheme: dark) {
          .mfa-header h2 {
            color: #f9fafb;
          }

          .mfa-header p {
            color: #9ca3af;
          }

          .code-type-toggle {
            background: #374151;
          }

          .toggle-btn {
            color: #9ca3af;
          }

          .toggle-btn.active {
            background: #4b5563;
            color: #f9fafb;
          }

          .code-input {
            background: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }

          .code-input:focus {
            border-color: #2563eb;
          }

          .code-input:disabled {
            background: #1f2937;
          }
        }
      `}</style>
    </div>
  );
};

export default MFAVerification;
