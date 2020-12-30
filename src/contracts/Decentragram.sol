pragma solidity ^0.5.0;

contract Decentragram {
    string public name = "Decentragram App";
    uint public imageCount = 0;
    mapping(uint => Image) public images;


    struct Image {
        uint id;
        string hash;
        string description;
        uint tipAmount;
        address payable author;
    }

    event ImageCreated(
        uint id,
        string hash,
        string description,
        uint tipAmount,
        address payable author
    );

    event ImageTipped(
        uint id,
        string hash,
        string description,
        uint tipAmount,
        address payable author
    );


    function uploadImage(string memory _hash, string memory _description) public {
        require(bytes(_hash).length > 0, "Hash is invalid");
        require(bytes(_description).length > 0, "Description cannot be empty");
        // Make sure the uploader address exists
        require(msg.sender != address( 0));
        imageCount++;
        
        // Add  image to contract
        images[imageCount] = Image(imageCount, _hash, _description, 0, msg.sender);

        // Trigger event
        emit ImageCreated(imageCount, _hash, _description, 0, msg.sender);
    }

    function tipImageAuthor(uint _imageId) public payable {
        require(_imageId > 0 && _imageId <= imageCount);
        Image memory image = images[_imageId];

        image.author.transfer(msg.value);
        image.tipAmount += msg.value;
        
        images[_imageId] = image;

        emit ImageTipped(image.id, image.hash, image.description, image.tipAmount, image.author );
    }
}

 