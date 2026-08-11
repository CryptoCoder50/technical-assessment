// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../openzeppelin/AccessControl.sol";
import "../openzeppelin/ReentrancyGuard.sol";
import "../openzeppelin/Counters.sol";

contract CertificateVerification is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    Counters.Counter private _certificateIds;

    struct Certificate {
        uint256 id;
        string studentName;
        string studentId;
        string courseName;
        string ipfsHash;
        uint256 issuedDate;
        uint256 expiryDate;
        bool isRevoked;
        address issuer;
        string grade;
        uint256 credits;
    }

    struct CertificateSummary {
        uint256 id;
        string studentName;
        string courseName;
        string grade;
        bool isValid;
        address issuer;
        uint256 issuedDate;
    }

    mapping(uint256 => Certificate) public certificates;
    mapping(string => uint256[]) private studentCertificates;
    mapping(address => uint256[]) private issuerCertificates;

    event CertificateIssued(
        uint256 indexed certificateId,
        string indexed studentId,
        string ipfsHash,
        address indexed issuer,
        uint256 issuedDate
    );

    event CertificateRevoked(
        uint256 indexed certificateId,
        string indexed studentId,
        uint256 revokedDate
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }

    function issueCertificate(
        string memory _studentName,
        string memory _studentId,
        string memory _courseName,
        string memory _ipfsHash,
        uint256 _expiryDuration,
        string memory _grade,
        uint256 _credits
    ) external onlyRole(ISSUER_ROLE) nonReentrant returns (uint256) {
        require(bytes(_studentName).length > 0, "Student name required");
        require(bytes(_studentId).length > 0, "Student ID required");
        require(bytes(_courseName).length > 0, "Course name required");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        require(_expiryDuration > 0, "Expiry duration must be > 0");
        require(_credits > 0, "Credits must be > 0");

        _certificateIds.increment();
        uint256 newId = _certificateIds.current();

        Certificate memory newCert = Certificate({
            id: newId,
            studentName: _studentName,
            studentId: _studentId,
            courseName: _courseName,
            ipfsHash: _ipfsHash,
            issuedDate: block.timestamp,
            expiryDate: block.timestamp + _expiryDuration,
            isRevoked: false,
            issuer: msg.sender,
            grade: _grade,
            credits: _credits
        });

        certificates[newId] = newCert;
        studentCertificates[_studentId].push(newId);
        issuerCertificates[msg.sender].push(newId);

        emit CertificateIssued(newId, _studentId, _ipfsHash, msg.sender, block.timestamp);

        return newId;
    }

    function verifyCertificate(uint256 _certificateId) 
        external 
        view 
        returns (
            bool isValid,
            CertificateSummary memory summary
        ) 
    {
        Certificate memory cert = certificates[_certificateId];
        require(cert.id != 0, "Certificate does not exist");

        bool valid = !cert.isRevoked && cert.expiryDate > block.timestamp;

        summary = CertificateSummary({
            id: cert.id,
            studentName: cert.studentName,
            courseName: cert.courseName,
            grade: cert.grade,
            isValid: valid,
            issuer: cert.issuer,
            issuedDate: cert.issuedDate
        });

        return (valid, summary);
    }

    function revokeCertificate(uint256 _certificateId) 
        external 
        onlyRole(ADMIN_ROLE) 
        nonReentrant 
    {
        Certificate storage cert = certificates[_certificateId];
        require(cert.id != 0, "Certificate does not exist");
        require(!cert.isRevoked, "Certificate already revoked");

        cert.isRevoked = true;

        emit CertificateRevoked(_certificateId, cert.studentId, block.timestamp);
    }

    function getStudentCertificates(string memory _studentId) 
        external 
        view 
        returns (CertificateSummary[] memory) 
    {
        uint256[] memory certIds = studentCertificates[_studentId];
        CertificateSummary[] memory certs = new CertificateSummary[](certIds.length);

        for (uint256 i = 0; i < certIds.length; i++) {
            Certificate memory cert = certificates[certIds[i]];
            bool isValid = !cert.isRevoked && cert.expiryDate > block.timestamp;

            certs[i] = CertificateSummary({
                id: cert.id,
                studentName: cert.studentName,
                courseName: cert.courseName,
                grade: cert.grade,
                isValid: isValid,
                issuer: cert.issuer,
                issuedDate: cert.issuedDate
            });
        }

        return certs;
    }

    function getCertificateCount() external view returns (uint256) {
        return _certificateIds.current();
    }

    function checkCertificateStatus(uint256 _certificateId) 
        external 
        view 
        returns (
            bool exists,
            bool isRevoked,
            bool isExpired,
            uint256 timeRemaining
        ) 
    {
        Certificate memory cert = certificates[_certificateId];
        exists = cert.id != 0;
        
        if (!exists) {
            return (false, false, false, 0);
        }

        isRevoked = cert.isRevoked;
        isExpired = cert.expiryDate <= block.timestamp;
        
        if (block.timestamp < cert.expiryDate) {
            timeRemaining = cert.expiryDate - block.timestamp;
        } else {
            timeRemaining = 0;
        }

        return (exists, isRevoked, isExpired, timeRemaining);
    }

    function addIssuer(address _issuer) external onlyRole(ADMIN_ROLE) {
        grantRole(ISSUER_ROLE, _issuer);
    }

    function removeIssuer(address _issuer) external onlyRole(ADMIN_ROLE) {
        revokeRole(ISSUER_ROLE, _issuer);
    }
}