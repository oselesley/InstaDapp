const { assert } = require("chai");
const Decentragram = artifacts.require("./Decentragram.sol");

require("chai")
    .use(require("chai-as-promised"))
    .should();

function toWei(val) {
    return web3.utils.toWei(val, "Ether");
}

contract("Decentragram", ([deployer, author, tipper]) => {
    let decentragram;

    before(async() => {
        console.log("logging web3: ", web3);
        decentragram = await Decentragram.deployed();
    })

    describe("deployment", async() => {
        it("deployed successfully", async () => {
            let address = await decentragram.address;
            assert.notEqual(address, "0x0");
            assert.notEqual(address, "");
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);
        });

        it("has a name", async () => {
            let name = await decentragram.name();
            console.log(name);
            assert.equal("Decentragram App", name);
        })
    })

    describe("images", async() => {
        let result, imageCount;
        let hash = "0x223sdhh"
        
        
        before(async() => {
            decentragram = decentragram == undefined ? await Decentragram.deployed() : decentragram;
            result = await decentragram.uploadImage(hash, "Image Description", { from: author })
            imageCount = await decentragram.imageCount();
            console.log("Image count: ", imageCount);
        })


        it ("creates images", async() => {
            assert.equal(imageCount, 1);

            await decentragram.uploadImage("", "Image `Description", { from: author }).should.be.rejected;
            await decentragram.uploadImage(hash, "", { from: author }).should.be.rejected;
            await decentragram.uploadImage("", "Image `Description", { from: deployer   }).should.be.rejected;
        })

        it("lists images", async() => {
            const image = await decentragram.images(imageCount);
            assert.equal(image.id.toNumber(), imageCount.toNumber(), "Id is correct");
            assert.equal(image.hash, hash, "Hash is correct");
            assert.equal(image.description, "Image Description");
            assert.equal(image.tipAmount, '0', "tip amount is correct");
            assert.equal(image.author, author, "author is correct");
        })

        it("allows users to tip images", async() => {
            let oldAuthorBalance;
            oldAuthorBalance = await web3.eth.getBalance(author);
            oldAuthorBalance = new web3.utils.BN(oldAuthorBalance);

            result = await decentragram.tipImageAuthor(imageCount, {from : tipper, value: web3.utils.toWei("1", "ether")})

            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), imageCount.toNumber(), "Id is correct");
            assert.equal(event.hash, hash, "Hash is correct");
            assert.equal(event.description, "Image Description");
            assert.equal(event.tipAmount, parseInt(toWei("1")), "tip amount is correct");
            assert.equal(event.author, author, "author is correct");

            let newAuthorBalance;
            newAuthorBalance = await web3.eth.getBalance(author);
            newAuthorBalance = new web3.utils.BN(newAuthorBalance);

            let tip = web3.utils.toWei("1", "Ether");
            tip = new web3.utils.BN(tip);

            console.log("balance: old -> " + oldAuthorBalance + "; new -> " + newAuthorBalance + "; tip -> " + tip);
            console.log("balance: new -> " + newAuthorBalance + "; expected -> " + (oldAuthorBalance.add(tip)));
            assert.equal(newAuthorBalance.toString(), oldAuthorBalance.add(tip).toString());


            await decentragram.tipImageAuthor(99, {from : tipper, value: web3.utils.toWei("1", "ether")}).should.be.rejected;
        })
    })
})