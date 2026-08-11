import Web3 from 'web3';
import contractConfig from '../config/contract.json';
import abi from '../config/abi.json';

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Define types for certificate data
interface CertificateSummary {
  id: number;
  studentName: string;
  courseName: string;
  grade: string;
  isValid: boolean;
  issuer: string;
  issuedDate: Date;
}

interface CertificateVerificationResult {
  isValid: boolean;
  summary: CertificateSummary;
}

class Web3Service {
  private web3: any;
  private contract: any;
  private account: string | null;

  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;

    // Initialize if ethereum is available
    if (typeof window !== 'undefined' && window.ethereum) {
      this.web3 = new Web3(window.ethereum);
      if (contractConfig && contractConfig.address) {
        this.contract = new this.web3.eth.Contract(abi, contractConfig.address);
      }
    }
  }

  /**
   * Connect wallet and get account
   */
  async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask!');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.account = accounts[0];

      // Listen for account changes
      window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
        this.account = newAccounts[0] || null;
      });

      return this.account;
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      throw new Error(error.message || 'Failed to connect wallet');
    }
  }

  /**
   * Get current account
   */
  async getAccount(): Promise<string | null> {
    if (!window.ethereum) {
      return null;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      return accounts[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.account !== null;
  }

  /**
   * Issue a new certificate
   */
  async issueCertificate(params: {
    studentName: string;
    studentId: string;
    courseName: string;
    ipfsHash: string;
    expiryDuration: number;
    grade: string;
    credits: number;
  }): Promise<number> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    if (!this.account) {
      throw new Error('Wallet not connected. Please connect first.');
    }

    try {
      const result = await this.contract.methods
        .issueCertificate(
          params.studentName,
          params.studentId,
          params.courseName,
          params.ipfsHash,
          params.expiryDuration,
          params.grade,
          params.credits
        )
        .send({ from: this.account });

      // Extract certificate ID from event
      const event = result.events?.CertificateIssued;
      if (!event) {
        throw new Error('CertificateIssued event not found');
      }

      return parseInt(event.returnValues.certificateId);
    } catch (error: any) {
      console.error('Failed to issue certificate:', error);
      throw new Error(error.message || 'Failed to issue certificate');
    }
  }

  /**
   * Verify a certificate by ID
   */
  async verifyCertificate(certificateId: number): Promise<CertificateVerificationResult> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.methods
        .verifyCertificate(certificateId)
        .call();

      // ✅ FIX: Properly handle the return value with type safety
      const summary = result.summary || {};
      
      return {
        isValid: result.isValid || false,
        summary: {
          id: parseInt(summary.id || '0'),
          studentName: summary.studentName || 'Unknown',
          courseName: summary.courseName || 'Unknown',
          grade: summary.grade || 'N/A',
          isValid: result.isValid || false,
          issuer: summary.issuer || '0x0',
          issuedDate: new Date(parseInt(summary.issuedDate || '0') * 1000),
        },
      };
    } catch (error: any) {
      console.error('Failed to verify certificate:', error);
      throw new Error(error.message || 'Failed to verify certificate');
    }
  }

  /**
   * Get all certificates for a student
   */
  async getStudentCertificates(studentId: string): Promise<CertificateSummary[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.methods
        .getStudentCertificates(studentId)
        .call();

      // Ensure result is an array
      const certs = Array.isArray(result) ? result : [];
      
      return certs.map((cert: any) => ({
        id: parseInt(cert.id || '0'),
        studentName: cert.studentName || 'Unknown',
        courseName: cert.courseName || 'Unknown',
        grade: cert.grade || 'N/A',
        isValid: cert.isValid || false,
        issuer: cert.issuer || '0x0',
        issuedDate: new Date(parseInt(cert.issuedDate || '0') * 1000),
      }));
    } catch (error: any) {
      console.error('Failed to get student certificates:', error);
      throw new Error(error.message || 'Failed to get certificates');
    }
  }
}

// Export a single instance
export const web3Service = new Web3Service();