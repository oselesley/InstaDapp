import React from "react";
import Web3 from "web3";

import "./App.css";
import Main from "./Main";
import Navbar from "./Navbar";
import logo from '../logo.svg';

import Decentragram from '../abis/Decentragram.json';
import ipfsClient from "ipfs-http-client";
const ipfs = ipfsClient({ host: "ipfs.infura.io", port: 5001, protocol: "https" })


class App extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      account: "",
      images: [],
      decentragram: null,
      loading: true,
      buffer: null,
      captureFile: null,
      uploadImage: null,
      tipImageOwner: null
    }
  }

  async componentDidMount() {
    await this.loadWeb3();
    await this.loadBlockChainData();
  }

  loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert("Non Ethereum Browser detected. You should consider trying metamask!");
    }
  }

  loadBlockChainData = async () => {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts(); 
    console.log("setting account state: " + accounts);
    this.setState({ account: accounts[0] });

    const networkId = await web3.eth.net.getId();
    const networkData = Decentragram.networks[networkId];

    if (networkData) {
      const decentragram = new web3.eth.Contract(Decentragram.abi, networkData.address);
      this.setState({ decentragram }, () => {
        console.log("setting decentragram: " + decentragram);
      })
      const imageCount = await decentragram.methods.imageCount().call();
      this.setState({ imageCount })

      const images = [];

      for (let i = 1; i < imageCount; i++) {
        var image = await decentragram.methods.images(i).call();
        images.push(image);
      }

      
      this.setState({ loading: false, images: [...this.state.images, ...images].sort((a, b) => b.tipAmount - a.tipAmount) });
    } else {
      window.alert("Decentragram data cannot be deployed to the specified network!");
    }
  }


  captureFile = (event) => {
    console.log("capturing!!");
    event.preventDefault();

    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) }, () => {
        console.log("loading file completed: buffer := ", this.state.buffer);
      })
    }
  }

  uploadImage = (description) => {
    console.log("uploading file to ipfs");

    ipfs.add(this.state.buffer, (error, result) => {
      if (error) {
        console.error(error);
        return;
      }

      this.setState({ loading: true });
      console.log(result);
      this.state.decentragram.methods.uploadImage(result[0].hash, description).send({ from: this.state.account }).on("transactionHash", (hash) => {
        this.setState({ loading: false })
      })


    })
  }

  tipImageOwner = async  (id) => {
    this.setState({ loading: true })
    await this.state.decentragram.methods.tipImageAuthor(id).send({ from: this.state.account, value: window.web3.utils.toWei("0.1", "ether")})
    .on("transactionHash", (hash) => {
      this.setState({ loading: false })
    });
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              images={this.state.images}
              captureFile={this.captureFile}
              uploadImage={this.uploadImage}
              tipImageOwner={this.tipImageOwner}
            />
        }
      </div>
    );
  }
}

export default App;
