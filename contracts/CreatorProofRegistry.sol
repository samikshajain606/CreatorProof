// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CreatorProofRegistry {

    struct ContentRecord {
        string contentId;
        string title;
        string sha256Hash;
        address creator;
        uint256 registeredAt;
        bool exists;
    }

    mapping(string => ContentRecord) private contentRecords;

    event ContentRegistered(
        string contentId,
        string title,
        string sha256Hash,
        address indexed creator,
        uint256 registeredAt
    );

    function registerContent(
        string memory _contentId,
        string memory _title,
        string memory _sha256Hash
    ) public {

        require(
            !contentRecords[_contentId].exists,
            "Content already registered"
        );

        contentRecords[_contentId] = ContentRecord({
            contentId: _contentId,
            title: _title,
            sha256Hash: _sha256Hash,
            creator: msg.sender,
            registeredAt: block.timestamp,
            exists: true
        });

        emit ContentRegistered(
            _contentId,
            _title,
            _sha256Hash,
            msg.sender,
            block.timestamp
        );
    }

    function getContent(
        string memory _contentId
    )
        public
        view
        returns (
            string memory contentId,
            string memory title,
            string memory sha256Hash,
            address creator,
            uint256 registeredAt,
            bool exists
        )
    {
        ContentRecord memory record = contentRecords[_contentId];

        return (
            record.contentId,
            record.title,
            record.sha256Hash,
            record.creator,
            record.registeredAt,
            record.exists
        );
    }

    function verifyContent(
        string memory _contentId,
        string memory _sha256Hash
    )
        public
        view
        returns (bool)
    {
        ContentRecord memory record = contentRecords[_contentId];

        if (!record.exists) {
            return false;
        }

        return keccak256(
            bytes(record.sha256Hash)
        ) == keccak256(
            bytes(_sha256Hash)
        );
    }
}